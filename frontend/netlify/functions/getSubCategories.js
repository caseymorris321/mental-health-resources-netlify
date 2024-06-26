const { getConnection, closeConnection } = require('./db');
const { SubCategory } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();
    console.log('Using existing database connection');

    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const subCategories = await SubCategory.find().sort({ category: 1, order: 1 });
    return {
      statusCode: 200,
      body: JSON.stringify(subCategories)
    };
  } catch (error) {
    console.error('Error in getSubCategories:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  } finally {
    await closeConnection();
  }
};