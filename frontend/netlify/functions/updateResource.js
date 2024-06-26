const mongoose = require('mongoose');
const { Resource } = require('./models/resourceModel');
const authMiddleware = require('./middleware/requireAuth');

const handler = async (event, context) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

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
  }
};

exports.handler = authMiddleware(handler);