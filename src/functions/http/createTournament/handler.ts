import 'source-map-support/register';
import * as uuid from 'uuid';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { commonRestMiddleware } from '@libs/lambda';
import { createLogger } from '@libs/logger';
import { TournamentsAccessor } from '@dataLayer/tournamentsAccessor';
import { parseUserId } from '@auth/rs256Auth0Authorizer/utils';
import * as fromTournamentModel from '@models/Tournament';
import schema, { createTournamentRequestBody } from './schema';


const tournamentsAccessor = new TournamentsAccessor();
const logger = createLogger('createTournament.handler');

const handler: ValidatedAPIGatewayProxyEvent<typeof schema> = async event => {
  logger.info('Started request', event);

  const { headers } = event;
  const payload: createTournamentRequestBody = event.body;
  const requestUserId = parseUserId(headers.Authorization);

  try {
    const newTournament = await tournamentsAccessor.createTournament({
      ...payload,
      tournamentId: uuid.v4(),
      createdBy: requestUserId,
      createdAt: Date.now(),
      status: fromTournamentModel.STATUS.created,
    });

    logger.info('Completed request', event);

    return {
      statusCode: 201,
      body: JSON.stringify(newTournament),
    };
  } catch (error) {
    logger.info('Failed request', { error: error.message });
  
    return {
      statusCode: 403,
      body: error.message,
    };
  }


}

export const main = commonRestMiddleware(handler);
