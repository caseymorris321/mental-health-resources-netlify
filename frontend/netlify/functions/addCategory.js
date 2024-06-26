const mongoose = require('mongoose');
const { Category } = require('./models/resourceModel');

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

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const body = JSON.parse(event.body);
    const maxOrderCategory = await Category.findOne().sort('-order');
    const newOrder = maxOrderCategory ? maxOrderCategory.order + 1 : 0;
    const category = new Category({
      ...body,
      order: newOrder
    });
    const newCategory = await category.save();
    return {
      statusCode: 201,
      body: JSON.stringify(newCategory)
    };
  } catch (error) {
    console.error('Error in createCategory:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message })
    };
  } finally {
    if (cachedDb) {
      await cachedDb.disconnect();
    }
  }
};