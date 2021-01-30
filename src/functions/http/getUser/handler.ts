import 'source-map-support/register';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { commonRestMiddleware } from '@libs/lambda';
import { createLogger } from '@libs/logger';
import { UsersAccessor } from '@dataLayer/usersAccessor';
import { parseUserId } from '@auth/rs256Auth0Authorizer/utils';


const usersAccessor = new UsersAccessor();
const logger = createLogger('getUser.handler');

const handler: ValidatedAPIGatewayProxyEvent<any> = async event => {
  logger.info('Started request', event);

  const { headers } = event;
  const userId = decodeURI(event.pathParameters.userId);
  const requestUserId = parseUserId(headers.Authorization);

  // Users can only get themselves
  if (requestUserId === userId) {
    try {
      const user = await usersAccessor.getUser(userId);
  
      logger.info('Completed request', { user });
  
      return {
        statusCode: 200,
        body: JSON.stringify(user),
      };
    } catch(error) {
      logger.error('Failed request', { error });

      return {
        statusCode: 404,
        body: JSON.stringify({
          message: error.message,
        }),
      };
    }
  }

  logger.error('Failed request', { requestUserId, userId });

  return {
    statusCode: 403,
    body: JSON.stringify({
      message: 'Users can only get themselves',
    }),
  };
}

export const main = commonRestMiddleware(handler);
