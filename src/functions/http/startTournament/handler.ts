import 'source-map-support/register';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { commonRestMiddleware } from '@libs/lambda';
import { createLogger } from '@libs/logger';
import { TournamentsAccessor } from '@dataLayer/tournamentsAccessor';
import { TournamentPlayersAccessor } from '@dataLayer/tournamentPlayersAccessor';
import { UsersAccessor } from '@dataLayer/usersAccessor';
import { parseUserId } from '@auth/rs256Auth0Authorizer/utils';
import * as fromTournamentModel from '@models/Tournament';
import { WebsocketAccessor } from '@dataLayer/websocketAccessor';


const tournamentsAccessor = new TournamentsAccessor();
const tournamentPlayersAccessor = new TournamentPlayersAccessor();
const usersAccessor = new UsersAccessor();
const websocketAccessor = new WebsocketAccessor();
const logger = createLogger('startTournament.handler');

const handler: ValidatedAPIGatewayProxyEvent<void> = async event => {
  logger.info('Started request', event);

  const { headers } = event;
  const { tournamentId } = event.pathParameters;
  const requestUserId = parseUserId(headers.Authorization);

  try {
    const tournament = await tournamentsAccessor.getTournament(tournamentId);

    // You can only start your own tournaments, with OPEN status
    if (tournament.createdBy === requestUserId
      && tournament.status === fromTournamentModel.STATUS.open
    ) {
      const updatedTournament = await tournamentsAccessor
        .updateTournamentStatus(
          tournamentId,
          fromTournamentModel.STATUS.started,
        );

      const registries = await tournamentPlayersAccessor
        .getTournamentActiveRegistries(tournamentId);

      // TODO: handle rules (matching schema, rounds)
      // TODO: round robin, 2 rounds
      for (const registry of registries) {
        const player = await usersAccessor.getUser(registry.playerUserId);
        await websocketAccessor.sendMessage(
          player.connectionId,
          {
            type: 'tournament:started',
            payload: { tournament: updatedTournament },
          },
        );
      }

  
      logger.info(
        'Completed request',
        { tournament: updatedTournament }
      );
  
      return {
        statusCode: 200,
        body: JSON.stringify(updatedTournament),
      };
    } else {
      throw new Error('Users can only start their own tournaments. Also, tournaments should be in OPEN status');
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
