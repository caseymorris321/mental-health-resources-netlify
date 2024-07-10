const { getConnection } = require('./db');
const { SubCategory } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const subCategoryData = JSON.parse(event.body);
    delete subCategoryData._id; // Remove _id to avoid duplicate key error

    const restoredSubCategory = await SubCategory.create(subCategoryData);

    return {
      statusCode: 200,
      body: JSON.stringify(restoredSubCategory)
    };
  } catch (error) {
    console.error('Error in undoDeleteSubCategory:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to undo delete subcategory' }) };
  }
};
