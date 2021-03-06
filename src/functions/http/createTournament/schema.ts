// TODO: handle rules (matching schema, rounds)

export default {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      minLength: 3,
    },
    gameId: {
      type: 'string',
    },
  },
  required: ['title', 'gameId'],
} as const;

export interface createTournamentRequestBody {
  title: string,
  gameId: string,
};