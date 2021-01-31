import 'source-map-support/register';
import * as uuid from 'uuid';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { commonRestMiddleware } from '@libs/lambda';
import { createLogger } from '@libs/logger';
import { TournamentsAccessor } from '@dataLayer/tournamentsAccessor';
import { TournamentPlayersAccessor } from '@dataLayer/tournamentPlayersAccessor';
import { UsersAccessor } from '@dataLayer/usersAccessor';
import { parseUserId } from '@auth/rs256Auth0Authorizer/utils';
import * as fromTournamentModel from '@models/Tournament';
import { WebsocketAccessor } from '@dataLayer/websocketAccessor';
import { MatchesAccessor } from '@dataLayer/matchesAccessor';
import * as fromTournamentPlayerRegistryModel from '@models/TournamentPlayerRegistry';
import Match, * as fromMatchModel from '@models/Match';
import { permutations } from '@libs/combinatorics';
import * as games from '@games';


const tournamentsAccessor = new TournamentsAccessor();
const tournamentPlayersAccessor = new TournamentPlayersAccessor();
const usersAccessor = new UsersAccessor();
const websocketAccessor = new WebsocketAccessor();
const matchesAccessor = new MatchesAccessor();
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

      // TODO: handle logic with lambda instead of locally
      const [gName, gVersion] = games.getGameNameAndVersion(tournament.gameId);
      const game = games[gName][gVersion];

      const registries = await tournamentPlayersAccessor
        .getTournamentRegistriesByPlayerStatus(
          tournamentId,
          fromTournamentPlayerRegistryModel.STATUS.ready,
        );

      if (registries.length < 2) {
        logger.info(
          'Too few online players to start the tournament',
          { registries },
        );

        return {
          statusCode: 401,
          body: JSON.stringify({
            message: 'Too few online players to start the tournament',
          }),
        };
      }

      const updatedTournament = await tournamentsAccessor
        .updateTournamentStatus(
          tournamentId,
          fromTournamentModel.STATUS.started,
        );

      const registriesWithConnections = (
        await Promise.all(
          registries.map(
            registry => usersAccessor.getUser(registry.playerUserId)
          )
        )
      ).map((user, index) => ({
        connectionId: user.connectionId,
        ...registries[index]
      }));

      // TODO: handle rules (matching schema, rounds)
      // TODO: round robin, 2 rounds

      // Build matches
      const regPermutations = [];
      permutations(registriesWithConnections, regPermutations, 2);

      const matches: any = await Promise.all(
        regPermutations.map(
          ([registryPlayer1, registryPlayer2]) => matchesAccessor.createMatch({
            tournamentId: registryPlayer1.tournamentId,
            matchId: uuid.v4(),
            player1Passkey: registryPlayer1.playerPasskey,
            player2Passkey: registryPlayer2.playerPasskey,
            status: fromMatchModel.STATUS.created,
            gameState: JSON.stringify(game.init()),
            nextTurn: fromMatchModel.PLAYERS.player1,
            winner: fromMatchModel.PLAYERS.noPlayer,
          })
        )
      );

      // Notify all players that tournament has started
      await Promise.all(
        registriesWithConnections.map(
          ({ connectionId }) => websocketAccessor.sendMessage(
            connectionId,
            {
              type: 'tournament:started',
              payload: { tournament: updatedTournament },
            },
          )
        )
      );

      // Make sure everyone starts playing!
      const matchesToNotify = [];
      const playerScheduledToNotify = new Set();

      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const p1Registry = regPermutations[i][0];

        const { player1Passkey, player2Passkey } = match;
        if (
          !playerScheduledToNotify.has(player1Passkey)
            && !playerScheduledToNotify.has(player2Passkey)
        ) {
          playerScheduledToNotify.add(player1Passkey);
          playerScheduledToNotify.add(player2Passkey);

          // Add player1 connection to match, for easy access
          match.player1ConnectionId = p1Registry.connectionId;
          matchesToNotify.push(match);
        }
      }

      // Update match status to ongoing
      await Promise.all(
        matchesToNotify.map(
          match => matchesAccessor.updateMatch(
            match.tournamentId,
            match.matchId,
            { status: fromMatchModel.STATUS.ongoing },
          ),
        ),
      );

      // Notify selected matches to start playing!
      await Promise.all(
        matchesToNotify.map(
          ({ player1ConnectionId, ...match }) => websocketAccessor.sendMessage(
            player1ConnectionId,
            {
              type: 'match:move_required',
              payload: {
                tournament: updatedTournament,
                match: {
                  tournamentId: match.tournamentId,
                  matchId: match.matchId,
                  gameState: match.gameState,
                  nextTurn: match.nextTurn,
                },
              },
            },
          )
        )
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
