const { getConnection } = require('./db');
const { Category, SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const categoryId = event.path.split('/').pop();

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { isDeleted: false },
      { new: true }
    );

    if (!category) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Category not found' }) };
    }

    const subCategories = await SubCategory.updateMany(
      { category: category.name, isDeleted: true },
      { isDeleted: false }
    );

    const resources = await Resource.updateMany(
      { category: category.name, isDeleted: true },
      { isDeleted: false }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ category, subCategories, resources }),
    };
  } catch (error) {
    console.error('Error in undoDeleteCategory:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to undo delete category' }) };
  }
};
