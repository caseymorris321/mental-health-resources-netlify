const { getConnection, closeConnection } = require('./db');
const { Category } = require('./models/resourceModel');

// frontend/netlify/functions/moveCategory.js

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { categoryId, newIndex } = JSON.parse(event.body);

    const category = await Category.findById(categoryId);
    if (!category || category.isDeleted) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Category not found' }) };
    }

    const allCategories = await Category.find({ isDeleted: false }).sort('order');
    const oldIndex = allCategories.findIndex(cat => cat._id.toString() === categoryId);

    // Remove the category from its old position
    allCategories.splice(oldIndex, 1);
    // Insert the category at its new position
    allCategories.splice(newIndex, 0, category);

    // Update orders
    for (let i = 0; i < allCategories.length; i++) {
      allCategories[i].order = i;
      await allCategories[i].save();
    }

    const updatedCategories = await Category.find({ isDeleted: false }).sort('order');
    return { statusCode: 200, body: JSON.stringify(updatedCategories) };
  } catch (error) {
    console.error('Error in moveCategory:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};
