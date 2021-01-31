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
import * as wsMatchesActions from '@wsactions/matches';
import { Tournament, TournamentPlayerRegistry, User } from '@models';
import * as fromTournamentPlayerRegistryModel from '@models/TournamentPlayerRegistry';


const tournamentPlayerRegistryAccessor = new TournamentPlayersAccessor();
const usersAccessor = new UsersAccessor();
const tournamentsAccessor = new TournamentsAccessor();
const matchesAccessor = new MatchesAccessor();
const webSocketAccessor = new WebsocketAccessor()
const logger = createLogger('setReady.handler');

const handler: ValidatedAPIGatewayProxyEvent<void> = async event => {
  logger.info('Started request', event);

  const selfConnectionId = event.requestContext.connectionId;
  const {
    payload: {
      passkey,
      tournamentId,
    },
  } = JSON.parse(event.body as string);

  let selfUser: User;
  try {
    selfUser = await usersAccessor.getUserByConnection(selfConnectionId);
  } catch (error) {
    logger.error('User does not exist', { error });

    return wsutils.error(error.message);
  }

  let selfRegistry: TournamentPlayerRegistry;
  try {
    selfRegistry = await tournamentPlayerRegistryAccessor.updateTournamentPlayerRegistryStatus(
      tournamentId,
      selfUser.userId,
      fromTournamentPlayerRegistryModel.STATUS.ready,
    );
  } catch (error) {
    logger.error(
      'Registry could not be updated',
      { error },
    );

    return wsutils.error(error.message);
  }

  let tournament: Tournament;
  try {
    tournament = await tournamentsAccessor.getTournament(tournamentId);
  } catch (error) {
    logger.error(
      'Tournament could not be fetched',
      { error },
    );

    return wsutils.error(error.message);
  }

  let selfNotStartedMatches: Match[];

  try {
    selfNotStartedMatches = await matchesAccessor.getMatchesByPlayerPasskeyAndStatus(
      passkey,
      fromMatchModel.STATUS.created,
    );
  } catch (error) {
    logger.error(
      'Problem while accessing not started matches',
      { error },
    );

    return wsutils.error(error.message);
  }

  let readyRegistries: TournamentPlayerRegistry[];
  try {
    readyRegistries = await tournamentPlayerRegistryAccessor.getTournamentRegistriesByPlayerStatus(
      tournamentId,
      fromTournamentPlayerRegistryModel.STATUS.ready,
    );
  } catch (error) {
    logger.error(
      'Problem while accessing tournament\'s ready players registries',
      { error },
    );

    return wsutils.error(error.message);
  }

  const opponentPasskeysInNotStartedMatches = selfNotStartedMatches.map(
    match => match.player1Passkey === passkey
      ? match.player2Passkey
      : match.player1Passkey
  );
  const opponentRegistries = readyRegistries
    .filter(registry => registry.playerPasskey !== passkey);
  const readyOpponentPasskeys = opponentRegistries
    .map(registry => registry.playerPasskey);

  let matchToStart: Match;
  let opponentRegistry: TournamentPlayerRegistry;
  for (let i = 0; i < opponentPasskeysInNotStartedMatches.length; i++) {
    const opponentPasskey = opponentPasskeysInNotStartedMatches[i];

    if (readyOpponentPasskeys.includes(opponentPasskey)) {
      matchToStart = selfNotStartedMatches[i]
      opponentRegistry = opponentRegistries[
        readyOpponentPasskeys.indexOf(opponentPasskey)
      ];
      break;
    }
  }

  if (matchToStart != null) {
    const results = await Promise.all([
      usersAccessor.getUser(opponentRegistry.playerUserId),
      tournamentPlayerRegistryAccessor.updateTournamentPlayerRegistryStatus(
        tournamentId,
        selfRegistry.playerUserId,
        fromTournamentPlayerRegistryModel.STATUS.inMatch,
      ),
      tournamentPlayerRegistryAccessor.updateTournamentPlayerRegistryStatus(
        tournamentId,
        opponentRegistry.playerUserId,
        fromTournamentPlayerRegistryModel.STATUS.inMatch,
      ),
      matchesAccessor.updateMatch(
        tournamentId,
        matchToStart.matchId,
        {
          status: fromMatchModel.STATUS.ongoing,
        },
      ),
    ]);

    const opponentUser = results[0];
    const createdMatch = results[3];
    let player1ConnectionId: string;

    if (createdMatch.player1Passkey === passkey) {
      player1ConnectionId = selfUser.connectionId;
    } else {
      player1ConnectionId = opponentUser.connectionId;
    }

    await webSocketAccessor.sendMessage(
      player1ConnectionId,
      wsMatchesActions.requestMovement(
        tournament,
        createdMatch,
      ),
    );
  }

  return wsutils.success('Everything is ok');
}


export const main = handler;
