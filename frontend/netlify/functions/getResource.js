const mongoose = require('mongoose');
const { Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();

    const resource = await Resource.findById(id);
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
    console.error('Error in getResource:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};