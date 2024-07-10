const { getConnection } = require('./db');
const { Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const urlParts = event.path.split('/');
    const resourceId = urlParts[urlParts.length - 1];

    if (!resourceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid resource ID' }),
      };
    }

    const resource = await Resource.findByIdAndUpdate(
      resourceId,
      { isDeleted: false },
      { new: true }
    );

    if (!resource) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No such resource' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(resource),
    };
  } catch (error) {
    console.error('Error in undoDeleteResource:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to undo delete resource' }),
    };
  }
};
