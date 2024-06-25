const mongoose = require('mongoose');
const { Category } = require('./models/resourceModel');
const authMiddleware = require('./middleware/requireAuth');

const handler = async (event, context) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (event.httpMethod !== 'DELETE') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Category not found' })
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Category deleted' })
    };
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};

exports.handler = authMiddleware(handler);