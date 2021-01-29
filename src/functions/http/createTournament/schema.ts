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
    rounds: {
      type: 'number',
    },
  },
  required: ['title', 'gameId', 'rounds'],
  additionalProperties: false,
} as const;

export interface createTournamentRequestBody {
  title: string,
  gameId: string,
};