import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { createLogger } from '@libs/logger';
import { User } from '@models';


const logger = createLogger('userAccessor');
const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);

export class UsersAccessor {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly usersTable = process.env.USERS_TABLE_NAME,
    private readonly userConnectionsIndex = process.env.USER_CONNECTIONS_INDEX_NAME,
  ) {}

  async getUser(userId: string): Promise<User> {
    logger.info(
      'Getting user',
      { userId },
    );

    const { Item }: any = await this.docClient.get({
      TableName: this.usersTable,
      Key: { userId },
    }).promise();

    if (Item) {
      logger.info('Successfully fetched user', Item);

      return Item as User;
    }

    logger.error('User not found');
    throw new Error('User not found');
  }

  async getUserByConnection(connectionId: string): Promise<User> {
    logger.info(
      'Getting user by connection',
      { connectionId },
    );

    const result = await this.docClient.query({
      TableName: this.usersTable,
      IndexName: this.userConnectionsIndex,
      KeyConditionExpression: 'connectionId = :connectionId',
      ExpressionAttributeValues: {
        ':connectionId': connectionId,
      },
    }).promise();

    if (result.Count !== 0) {
      const user = result.Items[0] as User;

      logger.info('Successfully fetched user', user);

      return user;
    }

    logger.error('User connection not found');

    throw new Error('User connection not found');
  }

  async createUser(user: User): Promise<User> {
    logger.info(
      'Creating a User',
      { user },
    );

    try {
      await this.docClient.put({
        TableName: this.usersTable,
        Item: user,
      }).promise();

      logger.info('User created');
  
      return user;
    } catch (error) {
      logger.error('User could not be created', { error });

      throw error;
    }

  }

  async updateUserConnection(userId: string, connectionId: string): Promise<void> {
    logger.info(
      'Updating User connection',
      { userId, connectionId },
    );

    try {
      await this.docClient.update({
        TableName: this.usersTable,
        Key: { userId },
        UpdateExpression: 'set connectionId = :connectionId',
        ExpressionAttributeValues: {
          ':connectionId': connectionId,
        },
        ReturnValues: 'NONE',
      }).promise();

      logger.info('User successfully updated');
    } catch (error) {
      logger.error('User could not be updated', { error });

      throw error;
    }
  }
}