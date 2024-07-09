const { getConnection } = require('./db');
const { Resource, SubCategory, Category } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const pathParts = event.path.split('/');
    const id = pathParts[pathParts.length - 2];
    const direction = pathParts[pathParts.length - 1];

    const resource = await Resource.findById(id);
    if (!resource) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Resource not found' }) };
    }

    const categories = await Category.find().sort('order');
    const currentCategoryIndex = categories.findIndex(c => c.name === resource.category);
    
    let newCategory = resource.category;
    let newSubCategory = resource.subCategory;

    if (direction === 'up' && currentCategoryIndex > 0) {
      newCategory = categories[currentCategoryIndex - 1].name;
      const subCategories = await SubCategory.find({ category: newCategory }).sort('-order');
      newSubCategory = subCategories[0].name;
    } else if (direction === 'down' && currentCategoryIndex < categories.length - 1) {
      newCategory = categories[currentCategoryIndex + 1].name;
      const subCategories = await SubCategory.find({ category: newCategory }).sort('order');
      newSubCategory = subCategories[0].name;
    } else {
      // Moving within the same category
      const subCategories = await SubCategory.find({ category: resource.category }).sort('order');
      const currentSubCategoryIndex = subCategories.findIndex(sc => sc.name === resource.subCategory);
      
      if (direction === 'up' && currentSubCategoryIndex > 0) {
        newSubCategory = subCategories[currentSubCategoryIndex - 1].name;
      } else if (direction === 'down' && currentSubCategoryIndex < subCategories.length - 1) {
        newSubCategory = subCategories[currentSubCategoryIndex + 1].name;
      }
    }

    // Update resource category and subcategory
    resource.category = newCategory;
    resource.subCategory = newSubCategory;

    // Set new order
    const maxOrderInNewSubCategory = await Resource.findOne({ category: newCategory, subCategory: newSubCategory })
      .sort('-order')
      .select('order');
    resource.order = (maxOrderInNewSubCategory?.order || -1) + 1;

    await resource.save();

    // Normalize orders in the new subcategory
    const allResources = await Resource.find({
      category: newCategory,
      subCategory: newSubCategory
    }).sort('order');
    for (let i = 0; i < allResources.length; i++) {
      allResources[i].order = i;
      await allResources[i].save();
    }

    return {
      statusCode: 200,
      body: JSON.stringify(resource)
    };
  } catch (error) {
    console.error('Error in moveResource:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};
