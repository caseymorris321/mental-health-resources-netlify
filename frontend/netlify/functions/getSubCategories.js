const mongoose = require('mongoose');
const { SubCategory } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

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
  }
};