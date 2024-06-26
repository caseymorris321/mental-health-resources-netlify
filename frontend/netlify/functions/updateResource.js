const { getConnection, closeConnection } = require('./db');
const { Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();
    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const body = JSON.parse(event.body);

    const resource = await Resource.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!resource) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Resource not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(resource)
    };
  } catch (error) {
    console.error('Error in updateResource:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message })
    };
  } finally {
    await closeConnection();
  }
};