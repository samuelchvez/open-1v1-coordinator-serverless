import { Tournament } from '@models';


export const startTournament = (tournament: Tournament) => ({
  type: 'tournament:started',
  payload: { tournament },
});
