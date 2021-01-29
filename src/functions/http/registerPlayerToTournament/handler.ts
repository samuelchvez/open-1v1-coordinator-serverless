import 'source-map-support/register';
import * as bcrypt from 'bcryptjs';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { commonRestMiddleware } from '@libs/lambda';
import { createLogger } from '@libs/logger';
import { TournamentPlayersAccessor } from '@dataLayer/tournamentPlayersAccessor';
import { parseUserId } from '@auth/rs256Auth0Authorizer/utils';
import * as fromTournamentPlayerRegistryModel from '@models/TournamentPlayerRegistry';
import schema, { createTournamentPlayerRegistryRequestBody } from './schema';


const PASSKEY_SALT_LENGTH = 8;
const tournamentPlayerRegistryAccessor = new TournamentPlayersAccessor();
const logger = createLogger('createTournamentPlayerRegistry.handler');

const handler: ValidatedAPIGatewayProxyEvent<typeof schema> = async event => {
  logger.info('Started request', event);

  const { headers } = event;
  const { tournamentId } = event.pathParameters;
  const payload: createTournamentPlayerRegistryRequestBody = event.body;
  const requestUserId = parseUserId(headers.Authorization);

  try {
    const newTournamentPlayerRegistry = await tournamentPlayerRegistryAccessor.createTournamentPlayerRegistry({
      ...payload,
      tournamentId,
      playerUserId: requestUserId,
      playerPasskey: bcrypt.hashSync(payload.playerPasskey, PASSKEY_SALT_LENGTH),
      playerStatus: fromTournamentPlayerRegistryModel.STATUS.offline,
      playerWins: 0,
      playerLoses: 0,
      playerDraws: 0,
    });

    logger.info(
      'Completed request',
      { tournamentPlayerRegistry: newTournamentPlayerRegistry }
    );

    return {
      statusCode: 201,
      body: JSON.stringify(newTournamentPlayerRegistry),
    };
  } catch (error) {
    logger.info('Failed request', { error });
  
    return {
      statusCode: 403,
      body: error.message,
    };
  }
}


export const main = commonRestMiddleware(handler);
