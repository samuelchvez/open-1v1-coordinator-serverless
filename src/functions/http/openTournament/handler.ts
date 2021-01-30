import 'source-map-support/register';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { commonRestMiddleware } from '@libs/lambda';
import { createLogger } from '@libs/logger';
import { TournamentsAccessor } from '@dataLayer/tournamentsAccessor';
import { parseUserId } from '@auth/rs256Auth0Authorizer/utils';
import * as fromTournamentModel from '@models/Tournament';


const tournamentsAccessor = new TournamentsAccessor();
const logger = createLogger('openTournament.handler');

const handler: ValidatedAPIGatewayProxyEvent<void> = async event => {
  logger.info('Started request', event);

  const { headers } = event;
  const { tournamentId } = event.pathParameters;
  const requestUserId = parseUserId(headers.Authorization);

  try {
    const tournament = await tournamentsAccessor.getTournament(tournamentId);

    // You can only open your own tournaments, with CREATED status
    if (tournament.createdBy === requestUserId
      && tournament.status === fromTournamentModel.STATUS.created
    ) {
      const updatedTournament = await tournamentsAccessor.updateTournamentStatus(
        tournamentId,
        fromTournamentModel.STATUS.open
      );
  
      logger.info(
        'Completed request',
        { tournament: updatedTournament }
      );
  
      return {
        statusCode: 200,
        body: JSON.stringify(updatedTournament),
      };
    } else {
      throw new Error('Users can only open their own tournaments. Also, tournaments should be in CREATED status');
    }
  } catch (error) {
    logger.error('Failed request', { error });
  
    return {
      statusCode: 403,
      body: error.message,
    };
  }
}


export const main = commonRestMiddleware(handler);
