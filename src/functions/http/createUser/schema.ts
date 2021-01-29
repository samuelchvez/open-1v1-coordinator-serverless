export default {
  type: 'object',
  properties: {
    nickname: {
      type: 'string'
    },
  },
  required: ['nickname'],
} as const;

export interface createUserRequestBody {
  nickname: string,
};