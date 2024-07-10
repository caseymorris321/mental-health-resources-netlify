const { getConnection, closeConnection } = require('./db');
const { Category } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const categories = await Category.find({ isDeleted: false }).sort('order');
    return {
      statusCode: 200,
      body: JSON.stringify(categories)
    };
  } catch (error) {
    console.error('Error in getCategories:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  } 
};
