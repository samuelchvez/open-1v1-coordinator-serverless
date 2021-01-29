import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { createLogger } from '@libs/logger';
import { Tournament } from '@models';


const logger = createLogger('tournamentsAccessor');
const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);

export class TournamentsAccessor {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly tournamentsTable = process.env.TOURNAMENTS_TABLE_NAME,
    private readonly tournamentStatusIndex = process.env.TOURNAMENT_STATUS_INDEX_NAME,
    private readonly tournamentsByUserIndex = process.env.TOURNAMENTS_BY_USER_INDEX_NAME,
  ) {}

  async getTournament(tournamentId: string): Promise<Tournament> {
    logger.info(
      'Getting tournament',
      { tournamentId },
    );

    try {
      const result: any = await this.docClient.get({
        TableName: this.tournamentsTable,
        Key: { tournamentId },
      }).promise();
  
      return result as Tournament;
    } catch (e) {
      logger.error('Tournament not found', JSON.stringify(e));

      throw new Error('Tournament not found');
    }


  }

  async getTournamentsByStatus(status: string): Promise<Tournament[]> {
    logger.info(
      'Getting tournaments by status',
      { status },
    );

    const result = await this.docClient.query({
      TableName: this.tournamentsTable,
      IndexName: this.tournamentStatusIndex,
      KeyConditionExpression: '#st = :st',
      ExpressionAttributeValues: {
        ':st': status,
      },
      ExpressionAttributeNames: {
        '#st': 'status',
      },
    }).promise();

    return result.Items as Tournament[];
  }

  async getTournamentsByCreator(userId: string): Promise<Tournament[]> {
    logger.info(
      'Getting tournaments by creator',
      { userId },
    );

    const result = await this.docClient.query({
      TableName: this.tournamentsTable,
      IndexName: this.tournamentsByUserIndex,
      KeyConditionExpression: 'createdBy = :createdBy',
      ExpressionAttributeValues: {
        ':createdBy': userId,
      },
    }).promise();

    return result.Items as Tournament[];
  }

  async createTournament(tournament: Tournament): Promise<Tournament> {
    logger.info(
      'Creating a Tournament',
      { tournament },
    );

    try {
      await this.docClient.put({
        TableName: this.tournamentsTable,
        Item: tournament,
      }).promise();

      logger.info('Tournament created');
  
      return tournament;
    } catch (e) {

      logger.error(`Tournament could not be created: ${JSON.stringify(e)}`);

      throw e;
    }
  }
}