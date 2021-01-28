import type { AWS } from '@serverless/typescript';

import {
  createUser,
  createTournament,
  getTournamentPlayersData,
  registerPlayerToTournament,
  unregisterPlayerFromTournament,
  openTournament,
  startTournament,
} from './src/functions/http';
import {
  connect,
  move,
  setReady,
  disconnect,
} from './src/functions/socket'
import { rs256Auth0Authorizer } from './src/functions/auth';


const serverlessConfiguration: AWS = {
  service: 'open-1v1-coordinator-serverless',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    }
  },
  plugins: ['serverless-webpack'],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    stage: "${opt:stage, 'dev'}",
    region: 'us-east-2',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      USERS_TABLE_NAME: 'Users-${self:provider.stage}',
      USER_CONNECTIONS_INDEX_NAME: 'UserConnectionsIndex-${self:provider.stage}',
      GAMES_TABLE_NAME: 'Games-${self:provider.stage}',
      TOURNAMENTS_TABLE_NAME: 'Tournaments-${self:provider.stage}',
      TOURNAMENT_STATUS_INDEX_NAME: 'TournamentStatusIndex-${self:provider.stage}',
      TOURNAMENTS_BY_USER_INDEX_NAME: 'TournamentsByUserIndex-${self:provider.stage}',
      TOURNAMENT_PLAYERS_TABLE_NAME: 'TournamentPlayers-${self:provider.stage}',
      TOURNAMENT_PLAYERS_PASSKEY_INDEX_NAME: 'TournamentPlayersPasskeysIndex-${self:provider.stage}',
      TOURNAMENT_PLAYERS_WINS_INDEX_NAME: 'TournamentPlayersWinsIndex-${self:provider.stage}',
      TOURNAMENT_PLAYERS_STATUS_INDEX_NAME: 'TournamentPlayersStatusIndex-${self:provider.stage}',
      MATCHES_TABLE_NAME: 'Matches-${self:provider.stage}',
      MATCHES_PLAYER1_INDEX_NAME: 'MatchesPlayer1Index-${self:provider.stage}',
      MATCHES_PLAYER2_INDEX_NAME: 'MatchesPlayer2Index-${self:provider.stage}',
    },
    lambdaHashingVersion: '20201221',
  },
  functions: {
    createUser,
    createTournament,
    getTournamentPlayersData,
    registerPlayerToTournament,
    unregisterPlayerFromTournament,
    openTournament,
    connect,
    startTournament,
    move,
    setReady,
    disconnect,
    rs256Auth0Authorizer,
  },
  resources: {
    Resources: {
      GatewayResponseDefault4XX: {
        Type: 'AWS::ApiGateway::GatewayResponse',
        Properties: {
          ResponseParameters: {
            'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
            'gatewayresponse.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization'",
            'gatewayresponse.header.Access-Control-Allow-Methods': "'GET,OPTIONS,POST,DELETE'",
          },
          ResponseType: 'DEFAULT_4XX',
          RestApiId: {
            Ref: 'ApiGatewayRestApi',
          },
        },
      },
      UsersDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.USERS_TABLE_NAME}',
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'userId',
              AttributeType: 'S',
            },
            {
              AttributeName: 'connectionId',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'userId',
              KeyType: 'HASH',
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: '${self:provider.environment.USER_CONNECTIONS_INDEX_NAME}',
              KeySchema: [
                {
                  AttributeName: 'connectionId',
                  KeyType: 'HASH',
                },
              ],
              Projection: {
                ProjectionType: 'KEYS_ONLY',
              },
            },
          ],
        },
      },
      GamesDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.GAMES_TABLE_NAME}',
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'gameId',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'gameId',
              KeyType: 'HASH',
            },
          ],
        },
      },
      TournamentsDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.TOURNAMENTS_TABLE_NAME}',
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'tournamentId',
              AttributeType: 'S',
            },
            {
              AttributeName: 'createdBy',
              AttributeType: 'S',
            },
            {
              AttributeName: 'createdAt',
              AttributeType: 'N',
            },
            {
              AttributeName: 'status',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'tournamentId',
              KeyType: 'HASH',
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: '${self:provider.environment.TOURNAMENT_STATUS_INDEX_NAME}',
              KeySchema: [
                {
                  AttributeName: 'status',
                  KeyType: 'HASH',
                },
                {
                  AttributeName: 'createdAt',
                  KeyType: 'RANGE',
                },
              ],
              Projection: {
                ProjectionType: 'KEYS_ONLY',
              },
            },
            {
              IndexName: '${self:provider.environment.TOURNAMENTS_BY_USER_INDEX_NAME}',
              KeySchema: [
                {
                  AttributeName: 'createdBy',
                  KeyType: 'HASH',
                },
                {
                  AttributeName: 'createdAt',
                  KeyType: 'RANGE',
                },
              ],
              Projection: {
                ProjectionType: 'KEYS_ONLY',
              },
            },
          ],
        },
      },
      TournamentPlayersDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.TOURNAMENT_PLAYERS_TABLE_NAME}',
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'tournamentId',
              AttributeType: 'S',
            },
            {
              AttributeName: 'playerUserId',
              AttributeType: 'S',
            },
            {
              AttributeName: 'playerPasskey',
              AttributeType: 'S',
            },
            {
              AttributeName: 'playerStatus',
              AttributeType: 'S',
            },
            {
              AttributeName: 'playerWins',
              AttributeType: 'N',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'tournamentId',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'playerUserId',
              KeyType: 'RANGE',
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: '${self:provider.environment.TOURNAMENT_PLAYERS_PASSKEY_INDEX_NAME}',
              KeySchema: [
                {
                  AttributeName: 'playerPasskey',
                  KeyType: 'HASH',
                },
              ],
              Projection: {
                ProjectionType: 'KEYS_ONLY',
              },
            },
          ],
          LocalSecondaryIndexes: [
            {
              IndexName: '${self:provider.environment.TOURNAMENT_PLAYERS_WINS_INDEX_NAME}',
              KeySchema: [
                {
                  AttributeName: 'tournamentId',
                  KeyType: 'HASH',
                },
                {
                  AttributeName: 'playerWins',
                  KeyType: 'RANGE',
                },
              ],
              Projection: {
                ProjectionType: 'KEYS_ONLY',
              },
            },
            {
              IndexName: '${self:provider.environment.TOURNAMENT_PLAYERS_STATUS_INDEX_NAME}',
              KeySchema: [
                {
                  AttributeName: 'tournamentId',
                  KeyType: 'HASH',
                },
                {
                  AttributeName: 'playerStatus',
                  KeyType: 'RANGE',
                },
              ],
              Projection: {
                ProjectionType: 'KEYS_ONLY',
              },
            },
          ],
        },
      },
      MatchesDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.MATCHES_TABLE_NAME}',
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            {
              AttributeName: 'tournamentId',
              AttributeType: 'S',
            },
            {
              AttributeName: 'matchId',
              AttributeType: 'S',
            },
            {
              AttributeName: 'player1Passkey',
              AttributeType: 'S',
            },
            {
              AttributeName: 'player2Passkey',
              AttributeType: 'S',
            },
            {
              AttributeName: 'status',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'tournamentId',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'matchId',
              KeyType: 'RANGE',
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: '${self:provider.environment.MATCHES_PLAYER1_INDEX_NAME}',
              KeySchema: [
                {
                  AttributeName: 'player1Passkey',
                  KeyType: 'HASH',
                },
                {
                  AttributeName: 'status',
                  KeyType: 'RANGE',
                },
              ],
              Projection: {
                ProjectionType: 'KEYS_ONLY',
              },
            },
            {
              IndexName: '${self:provider.environment.MATCHES_PLAYER2_INDEX_NAME}',
              KeySchema: [
                {
                  AttributeName: 'player2Passkey',
                  KeyType: 'HASH',
                },
                {
                  AttributeName: 'status',
                  KeyType: 'RANGE',
                },
              ],
              Projection: {
                ProjectionType: 'KEYS_ONLY',
              },
            },
          ],
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
