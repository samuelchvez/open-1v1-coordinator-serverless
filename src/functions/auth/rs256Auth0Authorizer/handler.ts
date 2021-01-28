import 'source-map-support/register';
import {
  APIGatewayTokenAuthorizerEvent,
  CustomAuthorizerResult,
} from 'aws-lambda';
import Axios from 'axios';
import { createLogger } from '@libs/logger';

import { verifyToken, getDecodedTokenHeader } from './utils';
import { JwksResponse } from './JwksResponse';


const logger = createLogger('auth.handler');

export const main = async (event: APIGatewayTokenAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  try {
    logger.info('Authorizing a user', event.authorizationToken);

    let cert: string;

    try {
      cert = await buildCert(
        process.env.JWS_WEB_KEY_SET_ENDPOINT,
        event.authorizationToken,
      );
    } catch(e) {
      logger.error('User was not authorized', e);

      return deny();
    }

    const { sub } = verifyToken(
      event.authorizationToken,
      cert,
    );

    logger.info('User was authorized');

    return {
      principalId: sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      },
    };
  } catch (e) {
    logger.error('User was not authorized', e);

    return deny();
  }
};


function deny() {
  return {
    principalId: 'user',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Deny',
          Resource: '*',
        },
      ],
    },
  };
}


async function buildCert(jwksUrl: string, authorizationHeader: string): Promise<string> {
  const { data }  = await Axios.get(jwksUrl);
  const { kid } = getDecodedTokenHeader(authorizationHeader);
  const keys = (data as JwksResponse).keys.filter(key => key.kid === kid);

  if (keys.length < 1) {
    throw new Error('Invalid keys signature');
  }

  return [
    '-----BEGIN CERTIFICATE-----',
    keys[0].x5c[0],
    '-----END CERTIFICATE-----'
  ].join('\n');
}
