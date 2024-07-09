const { getConnection } = require('./db');
const { Resource, SubCategory } = require('./models/resourceModel');

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

    const subCategories = await SubCategory.find({ category: resource.category }).sort('order');
    const currentSubCategoryIndex = subCategories.findIndex(sc => sc.name === resource.subCategory);
    
    let newSubCategory;
    if (direction === 'up' && currentSubCategoryIndex > 0) {
      newSubCategory = subCategories[currentSubCategoryIndex - 1].name;
    } else if (direction === 'down' && currentSubCategoryIndex < subCategories.length - 1) {
      newSubCategory = subCategories[currentSubCategoryIndex + 1].name;
    }

    if (newSubCategory) {
      // Moving to a different subcategory
      resource.subCategory = newSubCategory;
      const maxOrderInNewSubCategory = await Resource.findOne({ category: resource.category, subCategory: newSubCategory })
        .sort('-order')
        .select('order');
      resource.order = (maxOrderInNewSubCategory?.order || -1) + 1;
    } else {
      // Moving within the same subcategory
      const operator = direction === 'up' ? '$lt' : '$gt';
      const sort = direction === 'up' ? -1 : 1;

      const adjacentResource = await Resource.findOne({
        category: resource.category,
        subCategory: resource.subCategory,
        order: { [operator]: resource.order }
      }).sort({ order: sort });

      if (adjacentResource) {
        const tempOrder = resource.order;
        resource.order = adjacentResource.order;
        adjacentResource.order = tempOrder;
        await adjacentResource.save();
      }
    }

    await resource.save();

    // Normalize orders
    const allResources = await Resource.find({
      category: resource.category,
      subCategory: resource.subCategory
    }).sort('order');
    for (let i = 0; i < allResources.length; i++) {
      allResources[i].order = i;
      await allResources[i].save();
    }

    const updatedResources = await Resource.find({
      category: resource.category,
      subCategory: resource.subCategory
    }).sort('order');

    return {
      statusCode: 200,
      body: JSON.stringify(updatedResources)
    };
  } catch (error) {
    console.error('Error in moveResource:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};
