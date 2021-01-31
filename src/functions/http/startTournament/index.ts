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
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:Query',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TOURNAMENT_PLAYERS_TABLE_NAME}/index/${self:provider.environment.TOURNAMENT_PLAYERS_STATUS_INDEX_NAME}',
    },
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:GetItem',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.USERS_TABLE_NAME}',
    },
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.MATCHES_TABLE_NAME}',
    },
    {
      Effect: 'Allow',
      Action: [
        'execute-api:ManageConnections'
      ],
      Resource: {
        'Fn::Join': [
          ':',
          [
            'arn:aws:execute-api',
            '${self:provider.region}',
            '*',
            {
              'Fn::Join': [
                '/',
                [
                  { Ref: 'WebsocketsApi' },
                  '${self:provider.environment.APP_STAGE}',
                  '*'
                ]
              ]
            }
          ],
        ],
      },
    }
  ],
  events: [
    {
      http: {
        method: 'patch',
        path: 'tournaments/{tournamentId}/start',
        cors: true,
      }
    }
  ]
}
