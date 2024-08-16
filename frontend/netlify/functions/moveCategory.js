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
    if (!category || category.isDeleted) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Category not found or is deleted' }) };
    }

    // Fetch all non-deleted categories
    const allCategories = await Category.find({ isDeleted: false }).sort('order');
    
    // Find the current index of the category
    const currentIndex = allCategories.findIndex(cat => cat._id.toString() === categoryId);
    
    if (currentIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Category not found in active categories' }) };
    }

    // Remove the category from its current position
    const [movedCategory] = allCategories.splice(currentIndex, 1);
    
    // Insert the category at the new position
    allCategories.splice(newIndex, 0, movedCategory);

    // Update order for all categories
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