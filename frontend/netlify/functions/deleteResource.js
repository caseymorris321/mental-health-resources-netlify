const mongoose = require('mongoose');
const { Resource } = require('./models/resourceModel');
const authMiddleware = require('./middleware/requireAuth');

const handler = async (event, context) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

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
  }
};

exports.handler = authMiddleware(handler);