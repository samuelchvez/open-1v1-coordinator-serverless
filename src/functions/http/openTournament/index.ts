export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:UpdateItem',
        'dynamodb:GetItem',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TOURNAMENTS_TABLE_NAME}',
    },
  ],
  events: [
    {
      http: {
        method: 'patch',
        path: 'tournaments/{tournamentId}/open',
      }
    }
  ]
}
