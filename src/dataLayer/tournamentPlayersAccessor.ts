import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { createLogger } from '@libs/logger';
import { TournamentPlayerRegistry } from '@models';
import * as fromTournamentPlayerRegistry from '@models/TournamentPlayerRegistry';


const logger = createLogger('tournamentPlayersAccessor');
const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);

export class TournamentPlayersAccessor {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly tournamentPlayersTable = process.env.TOURNAMENT_PLAYERS_TABLE_NAME,
    private readonly tournamentPlayersPasskeyIndex = process.env.TOURNAMENT_PLAYERS_PASSKEY_INDEX_NAME,
    private readonly tournamentPlayerUserIdStatusIndex = process.env.TOURNAMENT_PLAYER_USER_ID_STATUS_INDEX_NAME,
    private readonly tournamentPlayerssStatusIndex = process.env.TOURNAMENT_PLAYERS_STATUS_INDEX_NAME,
    private readonly tournamentPlayerssWinsIndex = process.env.TOURNAMENT_PLAYERS_WINS_INDEX_NAME,
  ) {}

  async getTournamentPlayerRegistry(tournamentId: string, playerUserId: string): Promise<TournamentPlayerRegistry> {
    logger.info(
      'Getting tournament player registry',
      { tournamentId, playerUserId },
    );

    const { Item } : any = await this.docClient.get({
      TableName: this.tournamentPlayersTable,
      Key: { tournamentId, playerUserId },
    }).promise();

    if (Item) {
      return Item as TournamentPlayerRegistry;
    }

    logger.error('Tournament player registry not found');
    throw new Error('Tournament player registry not found');
  }

  async getTournamentPlayersRegisters(tournamentId: string): Promise<TournamentPlayerRegistry[]> {
    logger.info(
      'Getting all tournament player registers',
      { tournamentId },
    );

    const { Items } : any = await this.docClient.query({
      TableName: this.tournamentPlayersTable,
      IndexName: this.tournamentPlayerssWinsIndex,
      KeyConditionExpression: 'tournamentId = :tournamentId',
      ExpressionAttributeValues: {
        ':tournamentId': tournamentId,
      }
    }).promise();

    return Items as TournamentPlayerRegistry[];
  }

  async getTournamentPlayerRegistryByPasskey(playerPasskey: string): Promise<TournamentPlayerRegistry> {
    logger.info(
      'Getting tournament player registry by passkey',
      { playerPasskey },
    );

    const { Items } : any = await this.docClient.query({
      TableName: this.tournamentPlayersTable,
      IndexName: this.tournamentPlayersPasskeyIndex,
      KeyConditionExpression: 'playerPasskey = :playerPasskey',
      ExpressionAttributeValues: {
        ':playerPasskey': playerPasskey,
      },
    }).promise();

    if (Items.length === 1) {
      return Items[0] as TournamentPlayerRegistry;
    }

    logger.error('Tournament player registry not found');
    throw new Error('Tournament player registry not found');
  }

  async createTournamentPlayerRegistry(tournamentPlayerRegistry: TournamentPlayerRegistry): Promise<TournamentPlayerRegistry> {
    logger.info(
      'Creating a Tournament Player Registry',
      { tournamentPlayerRegistry },
    );

    try {
      await this.docClient.put({
        TableName: this.tournamentPlayersTable,
        Item: tournamentPlayerRegistry,
      }).promise();

      logger.info('Tournament Player Registry created');
  
      return tournamentPlayerRegistry;
    } catch (error) {
      logger.error('Tournament Player Registry could not be created', { error });

      throw error;
    }
  }

  async updateTournamentPlayerRegistryStatus(
    tournamentId: string,
    playerUserId: string,
    playerStatus: string,
  ): Promise<TournamentPlayerRegistry> {
    logger.info(
      'Updating Tournament Player Registry status',
      { tournamentId, playerUserId, playerStatus },
    );

    try {
      const { Attributes } = await this.docClient.update({
        TableName: this.tournamentPlayersTable,
        Key: { tournamentId, playerUserId },
        UpdateExpression: 'set playerStatus = :playerStatus',
        ExpressionAttributeValues: {
          ':playerStatus': playerStatus,
        },
        ReturnValues: 'ALL_NEW',
      }).promise();

      logger.info('Tournament Player Registry successfully updated');

      return Attributes as TournamentPlayerRegistry;
    } catch (error) {
      logger.error('Tournament Player Registry could not be updated', { error });

      throw error;
    }
  }

  async updateTournamentPlayerRegistryResults(
    tournamentId: string,
    playerUserId: string,
    playerWins: number,
    playerLoses: number,
    playerDraws: number,
  ): Promise<void> {
    logger.info(
      'Updating Tournament Player Registry results',
      { tournamentId, playerUserId, playerWins, playerLoses, playerDraws },
    );

    try {
      await this.docClient.update({
        TableName: this.tournamentPlayersTable,
        Key: { tournamentId, playerUserId },
        UpdateExpression: 'set playerWins = :playerWins, playerLoses = :playerLoses, playerDraws = :playerDraws',
        ExpressionAttributeValues: {
          ':playerWins': playerWins,
          ':playerLoses': playerLoses,
          ':playerDraws': playerDraws,
        },
        ReturnValues: 'ALL_NEW',
      }).promise();

      logger.info('Tournament Player Registry successfully updated');
    } catch (error) {
      logger.error('Tournament Player Registry could not be updated', { error });

      throw error;
    }
  }

  async getPlayersActiveRegistries(playerUserId: string): Promise<TournamentPlayerRegistry[]> {
    logger.info(
      'Getting active tournament player registries',
      { playerUserId },
    );

    const readyResults : any = await this.docClient.query({
      TableName: this.tournamentPlayersTable,
      IndexName: this.tournamentPlayerUserIdStatusIndex,
      KeyConditionExpression: 'playerUserId = :playerUserId AND playerStatus = :playerStatus',
      ExpressionAttributeValues: {
        ':playerUserId': playerUserId,
        ':playerStatus': fromTournamentPlayerRegistry.STATUS.ready,
      },
    }).promise();

    const inMatchResults : any = await this.docClient.query({
      TableName: this.tournamentPlayersTable,
      IndexName: this.tournamentPlayerUserIdStatusIndex,
      KeyConditionExpression: 'playerUserId = :playerUserId AND playerStatus = :playerStatus',
      ExpressionAttributeValues: {
        ':playerUserId': playerUserId,
        ':playerStatus': fromTournamentPlayerRegistry.STATUS.inMatch,
      },
    }).promise();

    return [
      ...readyResults.Items,
      ...inMatchResults.Items,
    ] as TournamentPlayerRegistry[];
  }

  async getTournamentRegistriesByPlayerStatus(tournamentId: string, playerStatus: string): Promise<TournamentPlayerRegistry[]> {
    logger.info(
      'Getting tournament player registries by status',
      { tournamentId, playerStatus },
    );

    const { Items } : any = await this.docClient.query({
      TableName: this.tournamentPlayersTable,
      IndexName: this.tournamentPlayerssStatusIndex,
      KeyConditionExpression: 'tournamentId = :tournamentId AND playerStatus = :playerStatus',
      ExpressionAttributeValues: {
        ':tournamentId': tournamentId,
        ':playerStatus': playerStatus,
      },
    }).promise();

    logger.info('Successfully retrieved player registries by status', { Items });

    return Items as TournamentPlayerRegistry[];
  }
}