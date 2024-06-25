const { Resource } = require('../models/resourceModel');
const authMiddleware = require('./auth');

const handler = async (event, context, auth) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
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
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message })
    };
  }
};

exports.handler = authMiddleware(handler);