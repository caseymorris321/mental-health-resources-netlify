const mongoose = require('mongoose');
const { Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    console.log('Attempting to fetch resources...');
    const resources = await Resource.find({}).sort({ category: 1, subCategory: 1, order: 1 });
    return {
      statusCode: 200,
      body: JSON.stringify(resources)
    };
  } catch (error) {
    console.error('Error in getResources:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message, stack: error.stack })
    };
  }
};