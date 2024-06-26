const mongoose = require('mongoose');
const { SubCategory, Resource } = require('./models/resourceModel');
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
    const { name, oldName, category } = JSON.parse(event.body);

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      id,
      { name, category },
      { new: true, runValidators: true }
    );

    if (!updatedSubCategory) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Subcategory not found' })
      };
    }

    await Resource.updateMany(
      { subCategory: oldName, category: category },
      { subCategory: name }
    );

    const updatedResources = await Resource.find({ subCategory: name, category: category });

    return {
      statusCode: 200,
      body: JSON.stringify({
        subCategory: updatedSubCategory,
        resources: updatedResources
      })
    };
  } catch (error) {
    console.error('Error in updateSubCategory:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message })
    };
  }
};

exports.handler = authMiddleware(handler);