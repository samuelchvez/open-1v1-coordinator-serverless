import 'source-map-support/register';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { TournamentPlayersAccessor } from '@dataLayer/tournamentPlayersAccessor';
import { createLogger } from '@libs/logger';
import * as wsutils from '@libs/socket';
import { UsersAccessor } from '@dataLayer/usersAccessor';
import { TournamentsAccessor } from '@dataLayer/tournamentsAccessor';
import { WebsocketAccessor } from '@dataLayer/websocketAccessor';
import { MatchesAccessor } from '@dataLayer/matchesAccessor';
import Match, * as fromMatchModel from '@models/Match';
import * as games from '@games';
import * as wsMatchesActions from '@wsactions/matches';
import { Tournament, TournamentPlayerRegistry } from '@models';
import * as fromTournamentPlayerRegistryModel from '@models/TournamentPlayerRegistry';


const tournamentPlayerRegistryAccessor = new TournamentPlayersAccessor();
const usersAccessor = new UsersAccessor();
const tournamentsAccessor = new TournamentsAccessor();
const matchesAccessor = new MatchesAccessor();
const webSocketAccessor = new WebsocketAccessor()
const logger = createLogger('move.handler');

interface CompletionData {
  connectionId: string,
  registry: TournamentPlayerRegistry,
};

interface HandleCompletionParams {
  tournament: Tournament,
  match: Match,
  isDraw: boolean,
  lastGameState: any,
  winnerPlayer: number,
  winnerData: CompletionData,
  loserData: CompletionData,
};

const handleCompletion = async ({
  tournament,
  match,
  isDraw,
  lastGameState,
  winnerPlayer,
  winnerData,
  loserData,
}: HandleCompletionParams) => {
  const updatedMatchAttributes = {
    status: fromMatchModel.STATUS.finished,
    gameState: JSON.stringify(lastGameState),
    winner: winnerPlayer,
  };

  const winnerAction = isDraw ? wsMatchesActions.draw : wsMatchesActions.won;
  const loserAction = isDraw ? wsMatchesActions.draw : wsMatchesActions.lost;

  await Promise.all([
    tournamentPlayerRegistryAccessor.updateTournamentPlayerRegistryStatus(
      tournament.tournamentId,
      winnerData.registry.playerUserId,
      fromTournamentPlayerRegistryModel.STATUS.unknown,
    ),
    tournamentPlayerRegistryAccessor.updateTournamentPlayerRegistryStatus(
      tournament.tournamentId,
      loserData.registry.playerUserId,
      fromTournamentPlayerRegistryModel.STATUS.unknown,
    ),
  ]);

  await Promise.all([
    tournamentPlayerRegistryAccessor.updateTournamentPlayerRegistryResults(
      tournament.tournamentId,
      winnerData.registry.playerUserId,
      winnerData.registry.playerWins + 1,
      winnerData.registry.playerLoses,
      winnerData.registry.playerDraws,
    ),
    tournamentPlayerRegistryAccessor.updateTournamentPlayerRegistryResults(
      tournament.tournamentId,
      loserData.registry.playerUserId,
      loserData.registry.playerWins,
      loserData.registry.playerLoses + 1,
      loserData.registry.playerDraws,
    ),
    matchesAccessor.updateMatch(
      tournament.tournamentId,
      match.matchId,
      updatedMatchAttributes,
    ),
    webSocketAccessor.sendMessage(
      winnerData.connectionId,
      winnerAction(
        tournament,
        {
          ...match,
          ...updatedMatchAttributes,
        }
      ),
    ),
    webSocketAccessor.sendMessage(
      loserData.connectionId,
      loserAction(
        tournament,
        {
          ...match,
          ...updatedMatchAttributes,
        }
      ),
    ),
  ]);
}

const handler: ValidatedAPIGatewayProxyEvent<void> = async event => {
  logger.info('Started request', event);

  const selfConnectionId = event.requestContext.connectionId;
  const {
    payload: {
      passkey,
      tournamentId,
      matchId,
      move,
    },
  } = JSON.parse(event.body as string);

  let match: Match;
  let isPlayer1 = false;

  try {
    match = await matchesAccessor.getMatch(tournamentId, matchId);
  } catch (error) {
    logger.error('Match does not exist', { error });

    return wsutils.error(error.message);
  }

  if (match.status !== fromMatchModel.STATUS.ongoing) {
    logger.error('Inconsistent match status', { matchStatus: match.status });

    return wsutils.forbidden('Inconsistent match status');
  }

  if (match.tournamentId !== tournamentId) {
    logger.error('Match and Tournament missmatch', { tournamentId, matchId });

    return wsutils.error('Match and Tournament missmatch');
  }

  if (match.player1Passkey !== passkey && match.player2Passkey !== passkey) {
    logger.error(
      'Access denied',
      { passkey, tournamentId, matchId, move },
    );

    return wsutils.forbidden('Passkey don\'t match with provided match');
  }

  isPlayer1 = match.player1Passkey === passkey;
  logger.info('Is playing player 1?', { isPlayer1 });

  if (
    (isPlayer1 && match.nextTurn !== fromMatchModel.PLAYERS.player1)
      || (!isPlayer1 && match.nextTurn !== fromMatchModel.PLAYERS.player2)
  ) {
    logger.error(
      'Tried to use your opponent turn',
      { isPlayer1, nextTurn: match.nextTurn },
    );

    return wsutils.forbidden('Tried to use your opponent turn');
  }

  // From this point on, this is a valid connection, although might not be an invalid move

  // TODO: handle game logic with lambda
  const tournament = await tournamentsAccessor.getTournament(tournamentId);
  const [gameName, gameVersion] = games.getGameNameAndVersion(tournament.gameId);
  const game = games[gameName][gameVersion];

  const selfRegistry = await tournamentPlayerRegistryAccessor.getTournamentPlayerRegistryByPasskey(
    isPlayer1 ? match.player1Passkey : match.player2Passkey
  );
  const opponentRegistry = await tournamentPlayerRegistryAccessor.getTournamentPlayerRegistryByPasskey(
    isPlayer1 ? match.player2Passkey : match.player1Passkey
  );
  const opponent = await usersAccessor.getUser(opponentRegistry.playerUserId);
  const gameState = JSON.parse(match.gameState);
  const { nextTurn } = match;
  const [newGameState, newNextTurn, newWinner] = game.next({ gameState, nextTurn, move });

  // Completed state
  if (newWinner !== fromMatchModel.PLAYERS.noPlayer) {
    logger.info(
      'Completed match',
      { isPlayer1, newGameState, newNextTurn, newWinner },
    );

    if (newWinner === fromMatchModel.PLAYERS.player1) {
      logger.info(
        'Player 1 wins',
        { isPlayer1, newGameState, newNextTurn, newWinner },
      );

      if (isPlayer1) {
        await handleCompletion({
          tournament,
          match,
          isDraw: false,
          lastGameState: newGameState,
          winnerPlayer: fromMatchModel.PLAYERS.player1,
          winnerData: {
            connectionId: selfConnectionId,
            registry: selfRegistry,
          },
          loserData: {
            connectionId: opponent.connectionId,
            registry: opponentRegistry,
          },
        });
      } else {
        await handleCompletion({
          tournament,
          match,
          isDraw: false,
          lastGameState: newGameState,
          winnerPlayer: fromMatchModel.PLAYERS.player1,
          winnerData: {
            connectionId: opponent.connectionId,
            registry: opponentRegistry,
          },
          loserData: {
            connectionId: selfConnectionId,
            registry: selfRegistry,
          },
        });
      }
    } else if (newWinner === fromMatchModel.PLAYERS.player2) {
      logger.info(
        'Player 2 wins',
        { isPlayer1, newGameState, newNextTurn, newWinner },
      );

      if (isPlayer1) {
        await handleCompletion({
          tournament,
          match,
          isDraw: false,
          lastGameState: newGameState,
          winnerPlayer: fromMatchModel.PLAYERS.player2,
          winnerData: {
            connectionId: opponent.connectionId,
            registry: opponentRegistry,
          },
          loserData: {
            connectionId: selfConnectionId,
            registry: selfRegistry,
          },
        });
      } else {
        await handleCompletion({
          tournament,
          match,
          isDraw: false,
          lastGameState: newGameState,
          winnerPlayer: fromMatchModel.PLAYERS.player2,
          winnerData: {
            connectionId: selfConnectionId,
            registry: selfRegistry,
          },
          loserData: {
            connectionId: opponent.connectionId,
            registry: opponentRegistry,
          },
        });
      }
    } else {
      // Draw
      logger.info(
        'Draw',
        { isPlayer1, newGameState, newNextTurn, newWinner },
      );

      await handleCompletion({
        tournament,
        match,
        isDraw: true,
        lastGameState: newGameState,
        winnerPlayer: fromMatchModel.PLAYERS.bothPlayers,
        winnerData: {
          connectionId: selfConnectionId,
          registry: selfRegistry,
        },
        loserData: {
          connectionId: opponent.connectionId,
          registry: opponentRegistry,
        },
      });
    }

    return wsutils.success('Completed match');
  }

  // TODO: deep gameState comparison to avoid updating matches that didn't change

  // Update match state
  const updatedMatch = await matchesAccessor.updateMatch(
    tournament.tournamentId,
    match.matchId,
    {
      gameState: JSON.stringify(newGameState),
      nextTurn: newNextTurn,
    }
  );

  logger.info('Keep playing', { updatedMatch });

  if (newNextTurn === fromMatchModel.PLAYERS.player1) {
    logger.info('Next turn is player 1');

    if (isPlayer1) {
      logger.info('Send message to current player');

      await webSocketAccessor.sendMessage(
        selfConnectionId,
        wsMatchesActions.requestMovement(tournament, updatedMatch),
      );
    } else {
      logger.info('Send message to opponent player');

      await webSocketAccessor.sendMessage(
        opponent.connectionId,
        wsMatchesActions.requestMovement(tournament, updatedMatch),
      );
    }
  } else {
    logger.info('Next turn is player 2');

    if (isPlayer1) {
      logger.info('Send message to opponent player');

      await webSocketAccessor.sendMessage(
        opponent.connectionId,
        wsMatchesActions.requestMovement(tournament, updatedMatch),
      );
    } else {
      logger.info('Send message to current player');

      await webSocketAccessor.sendMessage(
        selfConnectionId,
        wsMatchesActions.requestMovement(tournament, updatedMatch),
      );
    }
  }

  return wsutils.success('Keep playing');
}


export const main = handler;
