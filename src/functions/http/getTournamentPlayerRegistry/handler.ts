import 'source-map-support/register';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { commonRestMiddleware } from '@libs/lambda';
import { createLogger } from '@libs/logger';
import { TournamentPlayersAccessor } from '@dataLayer/tournamentPlayersAccessor';
import { parseUserId } from '@auth/rs256Auth0Authorizer/utils';


const tournamentPlayersAccessor = new TournamentPlayersAccessor();
const logger = createLogger('getTournamentPlayersRegistry.handler');

const handler: ValidatedAPIGatewayProxyEvent<any> = async event => {
  logger.info('Started request', event);

  const { headers } = event;
  const { tournamentId } = event.pathParameters;
  const requestUserId = parseUserId(headers.Authorization);

  try {
    const tournamentPlayerRegistry = await tournamentPlayersAccessor.getTournamentPlayerRegistry(
      tournamentId,
      requestUserId,
    );

    logger.info('Completed request', { tournamentPlayerRegistry });

    return {
      statusCode: 200,
      body: JSON.stringify(tournamentPlayerRegistry),
    };
  } catch(error) {
    logger.info('Failed request', { error });

    return {
      statusCode: 404,
      body: JSON.stringify({
        message: error.message,
      }),
    };
  }
}

export const main = commonRestMiddleware(handler);
