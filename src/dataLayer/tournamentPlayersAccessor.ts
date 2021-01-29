import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { createLogger } from '@libs/logger';
import { TournamentPlayerRegistry } from '@models';
// import * as fromTournamentPlayerRegistry from '@models/TournamentPlayerRegistry';


const logger = createLogger('tournamentPlayersAccessor');
const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);

export class TournamentPlayersAccessor {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly tournamentPlayersTable = process.env.TOURNAMENT_PLAYERS_TABLE_NAME,
    // private readonly tournamentPlayersPasskeyIndex = process.env.TOURNAMENT_PLAYERS_PASSKEY_INDEX_NAME,
    // private readonly tournamentPlayerssWinsIndex = process.env.TOURNAMENT_PLAYERS_WINS_INDEX_NAME,
    // private readonly tournamentPlayerssStatusIndex = process.env.TOURNAMENT_PLAYERS_STATUS_INDEX_NAME,
  ) {}

  async getTournamentPlayerRegistry(tournamentId: string, playerUserId: string): Promise<TournamentPlayerRegistry> {
    logger.info(
      'Getting tournament player registry',
      { tournamentId, playerUserId },
    );

    const { Item }:any = await this.docClient.get({
      TableName: this.tournamentPlayersTable,
      Key: { tournamentId, playerUserId },
    }).promise();

    if (Item) {
      return Item as TournamentPlayerRegistry;
    }

    logger.error('Tournament not found');
    throw new Error('Tournament not found');
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
}