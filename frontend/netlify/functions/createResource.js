const mongoose = require('mongoose');
const { Resource } = require('./models/resourceModel');
const authMiddleware = require('./middleware/requireAuth');

const handler = async (event, context) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const body = JSON.parse(event.body);
    const maxOrderResource = await Resource.findOne({ 
      category: body.category,
      subCategory: body.subCategory 
    }).sort('-order');
    const newOrder = maxOrderResource ? maxOrderResource.order + 1 : 0;
    const resource = new Resource({
      ...body,
      order: newOrder
    });
    const newResource = await resource.save();
    return {
      statusCode: 201,
      body: JSON.stringify(newResource)
    };
  } catch (error) {
    console.error('Error in createResource:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message })
    };
  }
};

exports.handler = authMiddleware(handler);