const { SubCategory } = require('../models/resourceModel');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const subCategories = await SubCategory.find().sort({ category: 1, order: 1 });
    return {
      statusCode: 200,
      body: JSON.stringify(subCategories)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};