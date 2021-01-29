export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:PutItem',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TOURNAMENTS_TABLE_NAME}',
    },
  ],
  events: [
    {
      http: {
        method: 'post',
        path: 'tournaments',
      }
    }
  ]
}
