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
      return { statusCode: 404, body: JSON.stringify({ message: 'SubCategory not found' }) };
    }

    const oldCategory = subCategory.category;
    const oldIndex = subCategory.order;

    // Check for existing subcategory with the same name in the new category
    const existingSubCategory = await SubCategory.findOne({
      name: subCategory.name,
      category: newCategory,
      _id: { $ne: subCategoryId }
    });

    if (existingSubCategory) {
      return { statusCode: 400, body: JSON.stringify({ message: 'A subcategory with this name already exists in the target category' }) };
    }

    // Update category if changed
    if (newCategory) {
      subCategory.category = newCategory;
    }

    // Adjust orders
    if (oldCategory === subCategory.category) {
      if (newIndex > oldIndex) {
        await SubCategory.updateMany(
          { category: subCategory.category, order: { $gt: oldIndex, $lte: newIndex } },
          { $inc: { order: -1 } }
        );
      } else if (newIndex < oldIndex) {
        await SubCategory.updateMany(
          { category: subCategory.category, order: { $gte: newIndex, $lt: oldIndex } },
          { $inc: { order: 1 } }
        );
      }
    } else {
      await SubCategory.updateMany(
        { category: oldCategory, order: { $gt: oldIndex } },
        { $inc: { order: -1 } }
      );

      await SubCategory.updateMany(
        { category: subCategory.category, order: { $gte: newIndex } },
        { $inc: { order: 1 } }
      );
    }

    subCategory.order = newIndex;
    await subCategory.save();

    // Update resources associated with this subcategory
    await Resource.updateMany(
      { subCategory: subCategory.name, category: oldCategory },
      { category: subCategory.category }
    );

    // Normalize orders in both old and new categories
    const categoriesToNormalize = [...new Set([oldCategory, subCategory.category])];

    for (const category of categoriesToNormalize) {
      const subCategories = await SubCategory.find({ category }).sort('order');
      for (let i = 0; i < subCategories.length; i++) {
        subCategories[i].order = i;
        await subCategories[i].save();
      }
    }

    const updatedSubCategories = await SubCategory.find().sort('category order');
    return { statusCode: 200, body: JSON.stringify(updatedSubCategories) };
  } catch (error) {
    console.error('Error in moveSubCategory:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};
