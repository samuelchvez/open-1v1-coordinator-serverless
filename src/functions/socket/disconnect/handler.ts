import 'source-map-support/register';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { createLogger } from '@libs/logger';
import * as wsutils from '@libs/socket';
import { UsersAccessor } from '@dataLayer/usersAccessor';
import { TournamentPlayersAccessor } from '@dataLayer/tournamentPlayersAccessor';
import * as fromTournamentPlayerRegistryModel from '@models/TournamentPlayerRegistry';


const usersAccessor = new UsersAccessor();
const tournamentPlayersAccessor = new TournamentPlayersAccessor();
const logger = createLogger('disconnect.handler');

const handler: ValidatedAPIGatewayProxyEvent<void> = async event => {
  logger.info('Started request', event);
  const { requestContext: { connectionId } } = event;


  try {
    const user = await usersAccessor.getUserByConnection(connectionId);

    await usersAccessor.updateUserConnection(
      user.userId,
      wsutils.OFFLINE_CONNECTION_ID,
    );

    // Find all active registries for this user (orphans)
    const orphanRegistries = await tournamentPlayersAccessor.getPlayersActiveRegistries(
      user.userId,
    );

    for (const orphanRegistry of orphanRegistries) {
      // if (orphanRegistry.playerStatus === fromTournamentPlayerRegistryModel.STATUS.inMatch) {
        // TODO: find all matches of this player on this tournament
        // TODO: make oponents win
        // TODO: if a match was playing, send the finish notification
        // TODO: mark matches as completed
      // }

      // Mark orphan registries as with unknown status
      await tournamentPlayersAccessor.updateTournamentPlayerRegistryStatus(
        orphanRegistry.tournamentId,
        orphanRegistry.playerUserId,
        fromTournamentPlayerRegistryModel.STATUS.unknown,
      );
    }

    logger.info('Completed request');

    return wsutils.success();

  } catch (error) {
    logger.error('Failed request', { error });

    return wsutils.forbidden(error.message);
  }
}


export const main = handler;
