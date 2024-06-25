const { Category } = require('../models/resourceModel');
const authMiddleware = require('./auth');

const handler = async (event, context, auth) => {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const id = event.path.split('/').pop();
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Category not found' })
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Category deleted' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};

exports.handler = authMiddleware(handler);