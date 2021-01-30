import 'source-map-support/register';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { commonRestMiddleware } from '@libs/lambda';
import { createLogger } from '@libs/logger';
import { UsersAccessor } from '@dataLayer/usersAccessor';
import { parseUserId } from '@auth/rs256Auth0Authorizer/utils';
import schema, { createUserRequestBody } from './schema';


const usersAccessor = new UsersAccessor();
const logger = createLogger('createUser.handler');

const handler: ValidatedAPIGatewayProxyEvent<typeof schema> = async event => {
  logger.info('Started request', event);

  const { headers } = event;
  const payload: createUserRequestBody = event.body;
  const requestUserId = parseUserId(headers.Authorization);

  try {
    const newUser = await usersAccessor.createUser({
      userId: requestUserId,
      ...payload
    });
  
    logger.info('Completed request', event);
  
    return {
      statusCode: 201,
      body: JSON.stringify(newUser),
    };
  } catch (error) {
    logger.error('Failed request', { error });
  
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: 'Users can only register themselves',
      }),
    };
  }
}

export const main = commonRestMiddleware(handler);
