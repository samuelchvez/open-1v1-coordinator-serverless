import 'source-map-support/register';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { commonRestMiddleware } from '@libs/lambda';
import { createLogger } from '@libs/logger';
import { TournamentsAccessor } from '@dataLayer/tournamentsAccessor';
import { Tournament } from '@models';


const tournamentsAccessor = new TournamentsAccessor();
const logger = createLogger('getTournaments.handler');

const handler: ValidatedAPIGatewayProxyEvent<any> = async event => {
  logger.info('Started request', event);

  const { status } = event.queryStringParameters;

  try {
    const tournaments: Tournament[] = await tournamentsAccessor.getTournamentsByStatus(status)

    logger.info('Completed request', tournaments);

    return {
      statusCode: 200,
      body: JSON.stringify(tournaments),
    };
  } catch (error) {
    logger.info('Failed request', { error });
  
    return {
      statusCode: 403,
      body: JSON.stringify(error),
    };
  }
}


export const main = commonRestMiddleware(handler);
