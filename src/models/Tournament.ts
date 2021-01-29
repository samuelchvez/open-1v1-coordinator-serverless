export default interface Tournament {
  tournamentId: string,
  createdBy: string,
  gameId: string,
  status: string,
  createdAt: number,
};

export const STATUS = {
  created: 'CREATED',
  open: 'OPEN',
  started: 'PLAYING',
  completed: 'COMPLETED',
};
