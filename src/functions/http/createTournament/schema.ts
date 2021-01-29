export default {
  type: 'object',
  properties: {
    title: {
      type: 'string'
    },
    gameId: {
      type: 'string',
    },
  },
  required: ['title', 'gameId'],
  additionalProperties: false,
} as const;

export interface createTournamentRequestBody {
  title: string,
  gameId: string,
};