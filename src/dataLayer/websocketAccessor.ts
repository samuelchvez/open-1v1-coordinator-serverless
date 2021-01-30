import * as AWS from 'aws-sdk';

import { createLogger } from '@libs/logger';


const logger = createLogger('websocketAccessor');
const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);
const stage = process.env.APP_STAGE;
const apiId = process.env.WEBSOCKETS_API_ID;

export class WebsocketAccessor {
  constructor(
    private readonly apiGateway = new XAWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: `${apiId}.execute-api.us-east-2.amazonaws.com/${stage}`
    })
  ) {}

  async sendMessage(connectionId: string, payload: object) {
    try {
      logger.info(
        'Sending message to a connection',
        { connectionId, payload }
      );
  
      await this.apiGateway.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(payload),
      }).promise();
    } catch(error) {
      logger.error('Failed to send message', { error });

      throw error;
  
      //  TODO: handle stale connections (make them lose) (this might be better on an intermmediate handler, matches has nothing to do here)
      // if (error.statusCode === 410) {
      //   logger.error('Stale connection');
      // }
    }
  }
}
