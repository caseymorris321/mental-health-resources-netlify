const { getConnection } = require('./db');
const { Category, SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const category = await Category.findByIdAndUpdate(id, { isDeleted: false }, { new: true });

    if (!category) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Category not found' }) };
    }

    // Restore associated subcategories
    await SubCategory.updateMany({ category: category.name }, { isDeleted: false });
    const subCategories = await SubCategory.find({ category: category.name, isDeleted: false });

    // Restore associated resources
    await Resource.updateMany({ category: category.name }, { isDeleted: false });
    const resources = await Resource.find({ category: category.name, isDeleted: false });

    return {
      statusCode: 200,
      body: JSON.stringify({ category, subCategories, resources })
    };
  } catch (error) {
    console.error('Error in undoDeleteCategory:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to undo delete category' }) };
  }
};
