import 'source-map-support/register';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { TournamentPlayersAccessor } from '@dataLayer/tournamentPlayersAccessor';
import { createLogger } from '@libs/logger';
import * as wsutils from '@libs/socket';
import { UsersAccessor } from '@dataLayer/usersAccessor';
import { TournamentsAccessor } from '@dataLayer/tournamentsAccessor';
import * as fromTournamentModel from '@models/Tournament';
import * as fromTournamentPlayerRegistryModel from '@models/TournamentPlayerRegistry';
import { WebsocketAccessor } from '@dataLayer/websocketAccessor';


const tournamentPlayerRegistryAccessor = new TournamentPlayersAccessor();
const usersAccessor = new UsersAccessor();
const tournamentsAccessor = new TournamentsAccessor();
const webSocketAccessor = new WebsocketAccessor()
const logger = createLogger('connect.handler');

const handler: ValidatedAPIGatewayProxyEvent<void> = async event => {
  logger.info('Started request', event);

  const { playerPasskey } = event.queryStringParameters;
  const { requestContext: { connectionId } } = event;


  try {
    const registry = await tournamentPlayerRegistryAccessor.getTournamentPlayerRegistryByPasskey(
      playerPasskey
    );

    const tournament = await tournamentsAccessor.getTournament(
      registry.tournamentId,
    );

    if (tournament.status === fromTournamentModel.STATUS.open) {
      await usersAccessor.updateUserConnection(
        registry.playerUserId,
        connectionId,
      );

      await tournamentPlayerRegistryAccessor.updateTournamentPlayerRegistryStatus(
        registry.tournamentId,
        registry.playerUserId,
        fromTournamentPlayerRegistryModel.STATUS.ready
      );

      // await webSocketAccessor.sendMessage(
      //   connectionId,
      //   {
      //     type: 'tournament:joined',
      //     payload: {
      //       tournament,
      //     },
      //   },
      // );
  
      logger.info('Completed request', { playerPasskey });
  
      return wsutils.success('nenecudazo');
    }

    logger.error('Access denied, tournament not open');

    return wsutils.forbidden('Access denied, tournament not open');

  } catch (error) {
    logger.error('Access denied', { error });

    return wsutils.forbidden(error.message);
  }
}


export const main = handler;
