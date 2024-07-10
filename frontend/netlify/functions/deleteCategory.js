const { getConnection } = require('./db');
const { Category, SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'DELETE') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const category = await Category.findById(id);
    if (!category) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Category not found' })
      };
    }

    // Soft delete the category
    category.isDeleted = true;
    await category.save();

    // Soft delete associated subcategories
    await SubCategory.updateMany({ category: category.name }, { isDeleted: true });

    // Soft delete associated resources
    await Resource.updateMany({ category: category.name }, { isDeleted: true });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Category and associated items soft deleted' })
    };
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  } 
};
