export default {
  type: 'object',
  properties: {
    nickname: {
      type: 'string',
      minLength: 2,
    },
  },
  required: ['nickname'],
} as const;

export interface createUserRequestBody {
  nickname: string,
};