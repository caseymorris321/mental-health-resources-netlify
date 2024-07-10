const { getConnection } = require('./db');
const { Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
  
    try {
      await getConnection();
  
      if (event.httpMethod !== 'PUT') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
      }
  
      let id;
      try {
        const body = JSON.parse(event.body);
        id = body.id;
      } catch (error) {
        console.error('Error parsing request body:', error);
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
      }
  
      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Resource ID is required' }) };
      }
  
      const resource = await Resource.findByIdAndUpdate(
        id,
        { isDeleted: false },
        { new: true }
      );
  
      if (!resource) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Resource not found' }) };
      }
  
      return {
        statusCode: 200,
        body: JSON.stringify(resource),
      };
    } catch (error) {
      console.error('Error in undoDeleteResource:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to undo delete resource' }) };
    }
  };
  