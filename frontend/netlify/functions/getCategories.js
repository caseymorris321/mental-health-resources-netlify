const mongoose = require('mongoose');
const { Category } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const categories = await Category.find({}).sort('order');
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