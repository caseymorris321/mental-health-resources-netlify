const mongoose = require('mongoose');
const { Category, SubCategory, Resource } = require('./models/resourceModel');
const authMiddleware = require('./middleware/requireAuth');

const handler = async (event, context) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const { name, oldName } = JSON.parse(event.body);

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Category not found' })
      };
    }

    await SubCategory.updateMany(
      { category: oldName },
      { category: name }
    );

    await Resource.updateMany(
      { category: oldName },
      { category: name }
    );

    const updatedSubCategories = await SubCategory.find({ category: name });
    const updatedResources = await Resource.find({ category: name });

    return {
      statusCode: 200,
      body: JSON.stringify({
        category: updatedCategory,
        subCategories: updatedSubCategories,
        resources: updatedResources
      })
    };
  } catch (error) {
    console.error('Error in updateCategory:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message })
    };
  }
};

exports.handler = authMiddleware(handler);