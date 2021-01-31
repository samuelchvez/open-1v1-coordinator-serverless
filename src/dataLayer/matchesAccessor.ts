import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { createLogger } from '@libs/logger';
import { Match } from '@models';


const logger = createLogger('matchesAccessor');
const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);

export class MatchesAccessor {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly matchesTable = process.env.MATCHES_TABLE_NAME,
    private readonly matchesStatusIndex = process.env.MATCHES_STATUS_INDEX_NAME,
    private readonly matchesPlayer1Index = process.env.MATCHES_PLAYER1_INDEX_NAME,
    private readonly matchesPlayer2Index = process.env.MATCHES_PLAYER2_INDEX_NAME,
  ) {}

  async getMatch(tournamentId: string, matchId: string): Promise<Match> {
    logger.info('Getting match', { tournamentId, matchId });

    const { Item }: any = await this.docClient.get({
      TableName: this.matchesTable,
      Key: { tournamentId, matchId },
    }).promise();

    if (Item) {
      logger.info('Successfully fetched match', Item);

      return Item as Match;
    }

    logger.error('Match not found');
    throw new Error('User not found');
  }

  async getMatchesByPlayerPasskeyAndStatus(playerPasskey: string, status: string): Promise<Match[]> {
    logger.info(
      'Getting matches by player and status',
      { playerPasskey, status },
    );

    const resultPlayer1 = await this.docClient.query({
      TableName: this.matchesTable,
      IndexName: this.matchesPlayer1Index,
      KeyConditionExpression: 'player1Passkey = :playerPasskey AND #st = :st',
      ExpressionAttributeValues: {
        ':playerPasskey': playerPasskey,
        ':st': status,
      },
      ExpressionAttributeNames: {
        '#st': 'status',
      }
    }).promise();

    const resultPlayer2 = await this.docClient.query({
      TableName: this.matchesTable,
      IndexName: this.matchesPlayer2Index,
      KeyConditionExpression: 'player2Passkey = :playerPasskey AND #st = :st',
      ExpressionAttributeValues: {
        ':playerPasskey': playerPasskey,
        ':st': status,
      },
      ExpressionAttributeNames: {
        '#st': 'status',
      }
    }).promise();

    const result = [
      ...resultPlayer1.Items,
      ...resultPlayer2.Items,
    ];

    logger.info(
      "Successfully fetched player status matches",
      { playerPasskey, status, result },
    );

    return result as Match[];
  }

  async createMatch(match: Match): Promise<Match> {
    logger.info(
      'Creating a Match',
      { match },
    );

    try {
      await this.docClient.put({
        TableName: this.matchesTable,
        Item: match,
      }).promise();

      logger.info('Match created');
  
      return match;
    } catch (error) {
      logger.error('Match could not be created', { error });

      throw error;
    }
  }

  async updateMatch(
    tournamentId: string,
    matchId: string,
    {
      status,
      gameState,
      nextTurn,
      winner,
    }: {
      status?: string,
      gameState?: string,
      nextTurn?: number,
      winner?: number,
    }): Promise<Match> {
    logger.info(
      'Updating Match',
      { status, gameState, nextTurn, winner },
    );

    const updateExpression = [];
    const nameExpression = {};
    const valueExpression = {};

    if (status) {
      updateExpression.push('#st = :st');
      nameExpression['#st'] = 'status';
      valueExpression[':st'] = status;
    }

    if (gameState) {
      updateExpression.push('gameState = :gameState');
      valueExpression[':gameState'] = gameState;
    }

    if (nextTurn) {
      updateExpression.push('nextTurn = :nextTurn');
      valueExpression[':nextTurn'] = nextTurn;
    }

    if (winner) {
      updateExpression.push('winner = :winner');
      valueExpression[':winner'] = winner;
    }

    try {
      const { Attributes } = await this.docClient.update({
        TableName: this.matchesTable,
        Key: { tournamentId, matchId },
        UpdateExpression: `set ${updateExpression.join(',')}`,
        ExpressionAttributeValues: valueExpression,
        ExpressionAttributeNames: Object.keys(nameExpression).length > 0
          ? nameExpression
          : undefined,
        ReturnValues: 'ALL_NEW',
      }).promise();

      logger.info('Match successfully updated');
      
      return Attributes as Match;
    } catch (error) {
      logger.error('Match could not be updated', { error });

      throw error;
    }
  }

  async getTournamentMatchesByStatus(
    tournamentId: string,
    status: string
  ): Promise<Match[]> {
    logger.info(
      'Getting matches by player and status',
      { tournamentId, status },
    );

    const { Items } = await this.docClient.query({
      TableName: this.matchesTable,
      IndexName: this.matchesStatusIndex,
      KeyConditionExpression: 'tournamentId = :tournamentId AND #st = :st',
      ExpressionAttributeValues: {
        ':tournamentId': tournamentId,
        ':st': status,
      },
      ExpressionAttributeNames: {
        '#st': 'status',
      }
    }).promise();

    return Items as Match[];
  }
}