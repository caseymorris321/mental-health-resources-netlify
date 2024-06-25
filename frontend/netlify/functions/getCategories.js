const { Category } = require('../models/resourceModel');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const categories = await Category.find({}).sort('order');
    return {
      statusCode: 200,
      body: JSON.stringify(categories)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};