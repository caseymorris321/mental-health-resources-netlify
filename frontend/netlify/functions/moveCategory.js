const { getConnection } = require('./db');
const { Category } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { categoryId, newIndex } = JSON.parse(event.body);

    const category = await Category.findById(categoryId);
    if (!category) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Category not found' }) };
    }

    const oldIndex = category.order;

    if (newIndex > oldIndex) {
      await Category.updateMany(
        { order: { $gt: oldIndex, $lte: newIndex } },
        { $inc: { order: -1 } }
      );
    } else if (newIndex < oldIndex) {
      await Category.updateMany(
        { order: { $gte: newIndex, $lt: oldIndex } },
        { $inc: { order: 1 } }
      );
    }

    category.order = newIndex;
    await category.save();

    // Normalize orders
    const allCategories = await Category.find().sort('order');
    for (let i = 0; i < allCategories.length; i++) {
      allCategories[i].order = i;
      await allCategories[i].save();
    }

    const updatedCategories = await Category.find().sort('order');
    return { statusCode: 200, body: JSON.stringify(updatedCategories) };
  } catch (error) {
    console.error('Error in moveCategory:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};
