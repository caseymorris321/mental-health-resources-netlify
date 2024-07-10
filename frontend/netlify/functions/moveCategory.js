const { getConnection } = require('./db');
const { Category } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const [, , categoryId, direction] = event.path.split('/');

    const categories = await Category.find().sort('order');
    const currentIndex = categories.findIndex(cat => cat._id.toString() === categoryId);

    if (currentIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Category not found' }) };
    }

    const newIndex = direction === 'up' ? Math.max(0, currentIndex - 1) : Math.min(categories.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      const [movedCategory] = categories.splice(currentIndex, 1);
      categories.splice(newIndex, 0, movedCategory);

      // Update orders
      for (let i = 0; i < categories.length; i++) {
        categories[i].order = i;
        await categories[i].save();
      }
    }

    const updatedCategories = await Category.find().sort('order');

    return {
      statusCode: 200,
      body: JSON.stringify(updatedCategories)
    };
  } catch (error) {
    console.error('Error in moveCategory:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to move category' }) };
  }
};
