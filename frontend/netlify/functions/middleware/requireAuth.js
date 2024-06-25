const { auth } = require('express-oauth2-jwt-bearer');

const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256'
});

const authMiddleware = (handler) => async (event, context) => {
  return new Promise((resolve, reject) => {
    const req = {
      headers: {
        authorization: event.headers.authorization
      }
    };
    const res = {
      status: (statusCode) => ({
        json: (body) => resolve({ statusCode, body: JSON.stringify(body) })
      })
    };
    const next = (error) => {
      if (error) {
        resolve({
          statusCode: 401,
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      } else {
        handler(event, context, req.auth).then(resolve).catch(reject);
      }
    };

    requireAuth(req, res, next);
  });
};

module.exports = authMiddleware;