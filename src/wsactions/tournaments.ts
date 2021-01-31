import { Tournament, TournamentPlayerRegistry } from '@models';


export const startTournament = (tournament: Tournament) => ({
  type: 'tournament:started',
  payload: { tournament },
});

export const notifyTournamentCompletion = (
  tournament: Tournament,
  results: TournamentPlayerRegistry[],
) => ({
  type: 'tournament:completed',
  payload: {
    tournament,
    results
  },
});
