const mongoose = require('mongoose');
const { Resource } = require('./models/resourceModel');

let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }

  const db = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedDb = db;
  return db;
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectToDatabase();

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