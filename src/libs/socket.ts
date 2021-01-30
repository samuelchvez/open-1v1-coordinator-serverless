export const success = (message?: string) => ({
  statusCode: 200,
  body: message,
});

export const error = (message?: string) => ({
  statusCode: 400,
  body: message,
});

export const unauthorized = (message?: string) => ({
  statusCode: 401,
  body: message,
});

export const forbidden = (message?: string) => ({
  statusCode: 403,
  body: message,
});

export const OFFLINE_CONNECTION_ID = 'offline';
