import 'source-map-support/register';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { commonRestMiddleware } from '@libs/lambda';
import { createLogger } from '@libs/logger';
import { TournamentsAccessor } from '@dataLayer/tournamentsAccessor';
import { Tournament } from '@models';


const tournamentsAccessor = new TournamentsAccessor();
const logger = createLogger('getTournament.handler');

const handler: ValidatedAPIGatewayProxyEvent<any> = async event => {
  logger.info('Started request', event);

  const { tournamentId } = event.pathParameters;

  try {
    const tournament: Tournament = await tournamentsAccessor.getTournament(
      tournamentId
    );

    logger.info('Completed request', tournament);

    return {
      statusCode: 200,
      body: JSON.stringify(tournament),
    };
  } catch (error) {
    logger.error('Failed request', { error });
  
    return {
      statusCode: 403,
      body: JSON.stringify(error),
    };
  }
}


export const main = commonRestMiddleware(handler);
