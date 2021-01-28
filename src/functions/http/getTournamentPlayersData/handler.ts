import 'source-map-support/register';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';


const handler: ValidatedEventAPIGatewayProxyEvent<any> = async (_event) => {
  return {
    statusCode: 200,
    body: '',
  };
}

export const main = middyfy(handler);
