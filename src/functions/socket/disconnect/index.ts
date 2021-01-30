export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:Query',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.USERS_TABLE_NAME}/index/${self:provider.environment.USER_CONNECTIONS_INDEX_NAME}',
    },
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:UpdateItem',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.USERS_TABLE_NAME}',
    },
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:Query',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TOURNAMENT_PLAYERS_TABLE_NAME}/index/${self:provider.environment.TOURNAMENT_PLAYER_USER_ID_STATUS_INDEX_NAME}',
    },
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:UpdateItem',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TOURNAMENT_PLAYERS_TABLE_NAME}',
    },
  ],
  events: [
    {
      websocket: {
        route: '$disconnect',
      }
    }
  ]
}
