const mongoose = require('mongoose');
const { Category } = require('./models/resourceModel');
const authMiddleware = require('./middleware/requireAuth');

const handler = async (event, context) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

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
  }
};

exports.handler = authMiddleware(handler);