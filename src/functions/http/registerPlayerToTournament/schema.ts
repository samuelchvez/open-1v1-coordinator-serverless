export default {
  type: 'object',
  properties: {
    playerPasskey: {
      type: 'string',
      minLength: 3,
    },
  },
  required: ['playerPasskey'],
  additionalProperties: false,
} as const;

export interface createTournamentPlayerRegistryRequestBody {
  playerPasskey: string,
};
