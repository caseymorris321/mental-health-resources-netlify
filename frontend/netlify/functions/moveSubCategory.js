const { getConnection } = require('./db');
const { SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { subCategoryId, newCategoryName, newIndex } = JSON.parse(event.body);

    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Subcategory not found' })
      };
    }

    const oldCategory = subCategory.category;
    subCategory.category = newCategoryName;

    // Update order of subcategories in the old category
    await SubCategory.updateMany(
      { category: oldCategory, order: { $gt: subCategory.order } },
      { $inc: { order: -1 } }
    );

    // Update order of subcategories in the new category
    await SubCategory.updateMany(
      { category: newCategoryName, order: { $gte: newIndex } },
      { $inc: { order: 1 } }
    );

    subCategory.order = newIndex;
    await subCategory.save();

    // Update associated resources
    await Resource.updateMany(
      { subCategory: subCategory.name, category: oldCategory },
      { category: newCategoryName }
    );

    // Normalize orders in both old and new categories
    for (const category of [oldCategory, newCategoryName]) {
      const subCategories = await SubCategory.find({ category }).sort('order');
      for (let i = 0; i < subCategories.length; i++) {
        subCategories[i].order = i;
        await subCategories[i].save();
      }
    }

    const updatedSubCategories = await SubCategory.find({ isDeleted: false }).sort('category order');
    return {
      statusCode: 200,
      body: JSON.stringify(updatedSubCategories)
    };
  } catch (error) {
    console.error('Error in moveSubCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message, stack: error.stack })
    };
  }
};
