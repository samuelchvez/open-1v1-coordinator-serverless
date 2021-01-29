import 'source-map-support/register';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { commonRestMiddleware } from '@libs/lambda';


const handler: ValidatedAPIGatewayProxyEvent<any> = async (_event) => {
  return {
    statusCode: 200,
    body: '',
  };
}

export const main = commonRestMiddleware(handler);
