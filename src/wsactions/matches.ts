import { Match } from '@models';
import { Tournament } from '@models';


const onGoingMatch = (tournament: Tournament, match: Match) => ({
  payload: {
    tournament,
    match: {
      tournamentId: match.tournamentId,
      matchId: match.matchId,
      gameState: match.gameState,
      nextTurn: match.nextTurn,
    },
  },
});

export const requestMovement = (tournament: Tournament, match: Match) => ({
  type: 'match:require_move',
  ...onGoingMatch(tournament, match),
});

export const won = (tournament: Tournament, match: Match) => ({
  type: 'match:won',
  ...onGoingMatch(tournament, match),
});

export const lost = (tournament: Tournament, match: Match) => ({
  type: 'match:lost',
  ...onGoingMatch(tournament, match),
});

export const draw = (tournament: Tournament, match: Match) => ({
  type: 'match:draw',
  ...onGoingMatch(tournament, match),
});
