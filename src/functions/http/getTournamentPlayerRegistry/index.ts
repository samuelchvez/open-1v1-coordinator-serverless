export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:GetItem',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TOURNAMENT_PLAYERS_TABLE_NAME}',
    },
  ],
  events: [
    {
      http: {
        method: 'get',
        path: 'tournament-player-registries/{tournamentId}',
        authorizer: 'rs256Auth0Authorizer',
        cors: true,
      }
    }
  ]
}
