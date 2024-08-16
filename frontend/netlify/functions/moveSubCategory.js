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
    if (!subCategory || subCategory.isDeleted) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Subcategory not found or is deleted' }) };
    }

    const oldCategory = subCategory.category;
    const oldIndex = subCategory.order;

    // Get all active subcategories in the old and new categories
    const oldCategorySubCategories = await SubCategory.find({ category: oldCategory, isDeleted: false }).sort('order');
    const newCategorySubCategories = oldCategory === newCategory 
      ? oldCategorySubCategories 
      : await SubCategory.find({ category: newCategory, isDeleted: false }).sort('order');

    if (oldCategory === newCategory) {
      // Moving within the same category
      const updatedSubCategories = oldCategorySubCategories.filter(sc => sc._id.toString() !== subCategoryId);
      updatedSubCategories.splice(newIndex, 0, subCategory);
      
      for (let i = 0; i < updatedSubCategories.length; i++) {
        updatedSubCategories[i].order = i;
        await updatedSubCategories[i].save();
      }
    } else {
      // Moving to a different category
      oldCategorySubCategories.splice(oldIndex, 1);
      newCategorySubCategories.splice(newIndex, 0, subCategory);

      for (let i = 0; i < oldCategorySubCategories.length; i++) {
        oldCategorySubCategories[i].order = i;
        await oldCategorySubCategories[i].save();
      }

      for (let i = 0; i < newCategorySubCategories.length; i++) {
        newCategorySubCategories[i].order = i;
        newCategorySubCategories[i].category = newCategory;
        await newCategorySubCategories[i].save();
      }
    }

    // Update associated resources
    await Resource.updateMany(
      { subCategory: subCategory.name, category: oldCategory, isDeleted: false },
      { $set: { category: newCategory } }
    );

    const updatedSubCategories = await SubCategory.find({ isDeleted: false }).sort('category order');
    const updatedResources = await Resource.find({ isDeleted: false }).sort('category subCategory order');

    return {
      statusCode: 200,
      body: JSON.stringify({ updatedSubCategories, updatedResources })
    };
  } catch (error) {
    console.error('Error in moveSubCategory:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};