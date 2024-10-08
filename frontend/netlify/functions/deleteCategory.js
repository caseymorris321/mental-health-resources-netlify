const { getConnection } = require('./db');
const { Category } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'DELETE') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const category = await Category.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!category) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Category not found' })
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(category)
    };
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  } 
};
