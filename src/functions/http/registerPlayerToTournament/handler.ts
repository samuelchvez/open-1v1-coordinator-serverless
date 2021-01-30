import 'source-map-support/register';
import * as uuid from 'uuid';

import type { ValidatedAPIGatewayProxyEvent } from '@libs/apiGateway';
import { commonRestMiddleware } from '@libs/lambda';
import { createLogger } from '@libs/logger';
import { TournamentPlayersAccessor } from '@dataLayer/tournamentPlayersAccessor';
import { parseUserId } from '@auth/rs256Auth0Authorizer/utils';
import * as fromTournamentPlayerRegistryModel from '@models/TournamentPlayerRegistry';


const tournamentPlayerRegistryAccessor = new TournamentPlayersAccessor();
const logger = createLogger('createTournamentPlayerRegistry.handler');

const handler: ValidatedAPIGatewayProxyEvent<void> = async event => {
  logger.info('Started request', event);

  const { headers } = event;
  const { tournamentId } = event.pathParameters;
  const requestUserId = parseUserId(headers.Authorization);

  try {
    const newTournamentPlayerRegistry = await tournamentPlayerRegistryAccessor.createTournamentPlayerRegistry({
      tournamentId,
      playerUserId: requestUserId,
      playerPasskey: uuid.v4(),
      playerStatus: fromTournamentPlayerRegistryModel.STATUS.unknown,
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
    logger.error('Failed request', { error });
  
    return {
      statusCode: 403,
      body: error.message,
    };
  }
}


export const main = commonRestMiddleware(handler);
