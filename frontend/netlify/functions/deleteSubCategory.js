const { getConnection } = require('./db');
const { SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'DELETE') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const subCategory = await SubCategory.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!subCategory) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Subcategory not found' })
      };
    }

    // Mark associated resources as deleted
    await Resource.updateMany(
      { subCategory: subCategory.name, category: subCategory.category },
      { isDeleted: true }
    );

    return {
      statusCode: 200,
      body: JSON.stringify(subCategory)
    };
  } catch (error) {
    console.error('Error in deleteSubCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  } 
};
