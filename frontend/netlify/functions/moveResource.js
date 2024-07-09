const { getConnection } = require('./db');
const { Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const pathParts = event.path.split('/');
    const id = pathParts[pathParts.length - 2];
    const { direction, newCategory, newSubCategory } = JSON.parse(event.body);

    const resource = await Resource.findById(id);
    if (!resource) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Resource not found' })
      };
    }

    const oldCategory = resource.category;
    const oldSubCategory = resource.subCategory;

    // If newCategory and newSubCategory are provided, update them
    if (newCategory && newSubCategory) {
      resource.category = newCategory;
      resource.subCategory = newSubCategory;
    }

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

      await Promise.all([resource.save(), adjacentResource.save()]);
    } else {
      const extremeResource = await Resource.findOne({
        category: resource.category,
        subCategory: resource.subCategory
      }).sort({ order: direction === 'up' ? 1 : -1 });
      if (extremeResource && extremeResource._id.toString() !== resource._id.toString()) {
        resource.order = direction === 'up' ? extremeResource.order - 1 : extremeResource.order + 1;
        await resource.save();
      }
    }

    // Normalize orders in the new subcategory
    const allResources = await Resource.find({
      category: resource.category,
      subCategory: resource.subCategory
    }).sort('order');
    for (let i = 0; i < allResources.length; i++) {
      allResources[i].order = i;
      await allResources[i].save();
    }

    // If the category or subcategory has changed, normalize orders in the old subcategory
    if (oldCategory !== resource.category || oldSubCategory !== resource.subCategory) {
      const oldSubcategoryResources = await Resource.find({
        category: oldCategory,
        subCategory: oldSubCategory
      }).sort('order');
      for (let i = 0; i < oldSubcategoryResources.length; i++) {
        oldSubcategoryResources[i].order = i;
        await oldSubcategoryResources[i].save();
      }
    }

    const updatedResources = await Resource.find().sort('category subCategory order');
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
