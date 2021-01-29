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

    const { Item }: any = await this.docClient.get({
      TableName: this.tournamentsTable,
      Key: { tournamentId },
    }).promise();

    if (Item) {
      return Item as Tournament;
    }

    logger.error('Tournament not found');
    throw new Error('Tournament not found');
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
    } catch (error) {
      logger.error('Tournament could not be created', { error });

      throw error;
    }
  }

  async updateTournamentStatus(tournamentId: string, status: string): Promise<Tournament> {
    logger.info(
      'Changing Tournament Status',
      { tournamentId, status },
    );

    try {
      const { Attributes } = await this.docClient.update({
        TableName: this.tournamentsTable,
        Key: { tournamentId },
        UpdateExpression: 'set #st = :st',
        ExpressionAttributeValues: {
          ':st': status,
        },
        ExpressionAttributeNames: {
          '#st': 'status',
        },
        ReturnValues: 'ALL_NEW',
      }).promise();

      logger.info('Tournament status successfully updated');

      return Attributes as Tournament;
    } catch (error) {
      logger.error('Tournament status could not be updated', { error });

      throw error;
    }
  }
}