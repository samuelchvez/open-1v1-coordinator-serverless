import { decode, verify } from 'jsonwebtoken';

import { JwtPayload } from './JwtPayload';
import { JwtHeader } from './JwtHeader';


export function parseUserId(authHeader: string): string {
  return decodeToken(authHeader).sub;
}

export function getAuthToken(authHeader: string): string {
  if (!authHeader) {
    throw new Error('No authoriation header');
  }

  if (!authHeader.toLocaleLowerCase().startsWith('bearer ')) {
    throw new Error('Invalid authorization bearer');
  }

  const split = authHeader.split(' ');
  return split[1];
}

export function verifyToken(authHeader: string, cert: string): JwtPayload {
  return verify(
    getAuthToken(authHeader),
    cert,
    { algorithms: ['RS256'] }
  ) as JwtPayload;
}

export function decodeToken(authHeader: string): JwtPayload {
  return decode(getAuthToken(authHeader)) as JwtPayload;
}

export function getDecodedTokenHeader(authHeader: string): JwtHeader {
  return (
    decode(
      getAuthToken(authHeader),
      { complete: true }
    ) as {[key: string]: any}
  ).header as JwtHeader;
}
