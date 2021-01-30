export default interface TournamentPlayerRegistry {
  tournamentId: string,
  playerUserId: string,
  playerPasskey: string,
  playerStatus: string,
  playerWins: number,
  playerLoses: number,
  playerDraws: number,
};

export const STATUS = {
  unknown: 'UNKNOWN',
  ready: 'READY',
  inMatch: 'IN_MATCH',
};
