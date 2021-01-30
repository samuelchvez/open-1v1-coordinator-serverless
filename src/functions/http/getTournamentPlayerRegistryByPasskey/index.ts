export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:Query',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TOURNAMENT_PLAYERS_TABLE_NAME}/index/${self:provider.environment.TOURNAMENT_PLAYERS_PASSKEY_INDEX_NAME}',
    },
  ],
  events: [
    {
      http: {
        method: 'get',
        path: 'tournament-player-registries/by-player-passkey/{playerPasskey}',
        authorizer: 'rs256Auth0Authorizer',
        cors: true,
      }
    }
  ]
}
