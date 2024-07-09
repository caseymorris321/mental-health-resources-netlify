const { getConnection } = require('./db');
const { SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const pathParts = event.path.split('/');
    const subCategoryId = pathParts[pathParts.length - 2];
    const { newIndex, newCategory } = JSON.parse(event.body);

    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Subcategory not found' }) };
    }

    const oldOrder = subCategory.order;
    const oldCategory = subCategory.category;

    // Update category if it has changed
    subCategory.category = newCategory;

    if (newCategory === oldCategory) {
      // Moving within the same category
      if (newIndex > oldOrder) {
        // Moving down
        await SubCategory.updateMany(
          { 
            category: newCategory, 
            order: { $gt: oldOrder, $lte: newIndex },
            _id: { $ne: subCategoryId }
          },
          { $inc: { order: -1 } }
        );
      } else if (newIndex < oldOrder) {
        // Moving up
        await SubCategory.updateMany(
          { 
            category: newCategory, 
            order: { $gte: newIndex, $lt: oldOrder },
            _id: { $ne: subCategoryId }
          },
          { $inc: { order: 1 } }
        );
      }
    } else {
      // Moving to a different category
      await SubCategory.updateMany(
        { 
          category: newCategory, 
          order: { $gte: newIndex },
          _id: { $ne: subCategoryId }
        },
        { $inc: { order: 1 } }
      );

      // Adjust orders in the old category
      await SubCategory.updateMany(
        {
          category: oldCategory,
          order: { $gt: oldOrder }
        },
        { $inc: { order: -1 } }
      );
    }

    // Set the new order for the moved subcategory
    subCategory.order = newIndex;
    await subCategory.save();

    // Update the category of all resources in this subcategory
    if (oldCategory !== newCategory) {
      await Resource.updateMany(
        { subCategory: subCategory.name, category: oldCategory },
        { $set: { category: newCategory } }
      );
    }

    // Normalize orders within the new category
    const subCategoriesInNewCategory = await SubCategory.find({ category: newCategory }).sort('order');
    for (let i = 0; i < subCategoriesInNewCategory.length; i++) {
      subCategoriesInNewCategory[i].order = i;
      await subCategoriesInNewCategory[i].save();
    }

    // If the category has changed, normalize orders in the old category
    if (oldCategory !== newCategory) {
      const subCategoriesInOldCategory = await SubCategory.find({ category: oldCategory }).sort('order');
      for (let i = 0; i < subCategoriesInOldCategory.length; i++) {
        subCategoriesInOldCategory[i].order = i;
        await subCategoriesInOldCategory[i].save();
      }
    }

    // Fetch all subcategories to return updated state
    const allSubCategories = await SubCategory.find().sort('category order');

    return {
      statusCode: 200,
      body: JSON.stringify(allSubCategories)
    };
  } catch (error) {
    console.error('Error in updateSubcategoryOrder:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message, stack: error.stack })
    };
  }
};
