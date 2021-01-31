export default interface Match {
  tournamentId: string,
  matchId: string,
  player1Passkey: string,
  player2Passkey: string,
  status: string,
  gameState: string,
  nextTurn: number,
  winner: number,
};

export const STATUS = {
  created: 'WAITING',
  ongoing: 'ONGOING',
  finished: 'FINISHED',
};

export const PLAYERS = {
  player1: 1,
  player2: 2,
  noPlayer: 0,
  bothPlayers: -1,
};
