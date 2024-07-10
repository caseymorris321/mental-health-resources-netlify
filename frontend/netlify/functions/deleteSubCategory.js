const { getConnection, closeConnection } = require('./db');
const { SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'DELETE') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Subcategory not found' })
      };
    }

    // Soft delete the subcategory
    subCategory.isDeleted = true;
    await subCategory.save();

    // Soft delete associated resources
    await Resource.updateMany({ subCategory: subCategory.name }, { isDeleted: true });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Subcategory and associated resources soft deleted' })
    };
  } catch (error) {
    console.error('Error in deleteSubCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  } 
};
