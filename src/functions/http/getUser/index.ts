export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:GetItem',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.USERS_TABLE_NAME}',
    },
  ],
  events: [
    {
      http: {
        method: 'get',
        path: 'users/{userId}',
        authorizer: 'rs256Auth0Authorizer',
        cors: true
      }
    }
  ]
}
