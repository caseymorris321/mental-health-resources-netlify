const { getConnection } = require('./db');
const { Category } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const category = await Category.findByIdAndUpdate(id, { isDeleted: false }, { new: true });

    if (!category) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Category not found' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(category)
    };
  } catch (error) {
    console.error('Error in undoDeleteCategory:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to undo delete category' }) };
  }
};
