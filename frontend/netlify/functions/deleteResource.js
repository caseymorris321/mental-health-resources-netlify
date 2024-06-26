const { getConnection, closeConnection } = require('./db');
const { Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'DELETE') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();

    const resource = await Resource.findByIdAndDelete(id);
    if (!resource) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Resource not found' })
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Resource deleted' })
    };
  } catch (error) {
    console.error('Error in deleteResource:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  } finally {
    await closeConnection();
  }
};