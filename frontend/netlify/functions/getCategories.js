const mongoose = require('mongoose');
const { Category } = require('./models/resourceModel');


const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 1) {
      console.log('Using existing database connection');
      return mongoose.connection;
    }

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  return mongoose.connection;

};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectToDatabase();

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