export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  environment: {
    JWS_WEB_KEY_SET_ENDPOINT: 'https://dev-xpq7j4qr.us.auth0.com/.well-known/jwks.json',
  },
};
