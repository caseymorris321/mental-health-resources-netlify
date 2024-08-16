const { getConnection } = require('./db');
const { SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { subCategoryId, newIndex, newCategory } = JSON.parse(event.body);

    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Subcategory not found' }) };
    }

    const oldCategory = subCategory.category;
    const oldIndex = subCategory.order;

    if (oldCategory === newCategory) {
      // Moving within the same category
      if (newIndex > oldIndex) {
        await SubCategory.updateMany(
          { category: newCategory, order: { $gt: oldIndex, $lte: newIndex } },
          { $inc: { order: -1 } }
        );
      } else if (newIndex < oldIndex) {
        await SubCategory.updateMany(
          { category: newCategory, order: { $gte: newIndex, $lt: oldIndex } },
          { $inc: { order: 1 } }
        );
      }
    } else {
      // Moving to a different category
      await SubCategory.updateMany(
        { category: oldCategory, order: { $gt: oldIndex } },
        { $inc: { order: -1 } }
      );
      await SubCategory.updateMany(
        { category: newCategory, order: { $gte: newIndex } },
        { $inc: { order: 1 } }
      );
    }

    subCategory.order = newIndex;
    subCategory.category = newCategory;
    await subCategory.save();

    // Update associated resources
    await Resource.updateMany(
      { subCategory: subCategory.name, category: oldCategory },
      { $set: { category: newCategory } }
    );

    const updatedSubCategories = await SubCategory.find().sort('category order');
    const updatedResources = await Resource.find().sort('category subCategory order');

    return {
      statusCode: 200,
      body: JSON.stringify({ updatedSubCategories, updatedResources })
    };
  } catch (error) {
    console.error('Error in moveSubCategory:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};
