import schema from './schema';


export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:PutItem',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.USERS_TABLE_NAME}',
    },
  ],
  events: [
    {
      http: {
        method: 'post',
        path: 'users',
        authorizer: 'rs256Auth0Authorizer',
        cors: true,
        request: {
          schema: {
            'application/json': schema,
          },
        },
      },
    },
  ],
}
