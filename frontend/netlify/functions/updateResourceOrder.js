const { getConnection } = require('./db');
const { Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PATCH' && event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const pathParts = event.path.split('/');
    const resourceId = pathParts[pathParts.length - 2];

    console.log('Extracted resourceId:', resourceId);

    if (!resourceId || resourceId === 'undefined') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid resource ID' }) };
    }

    const { newIndex, newCategory, newSubCategory } = JSON.parse(event.body);

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Resource not found' }) };
    }

    const oldCategory = resource.category;
    const oldSubCategory = resource.subCategory;

    // Update category and subcategory
    resource.category = newCategory;
    resource.subCategory = newSubCategory;

    // Update orders of other resources
    await Resource.updateMany(
      { 
        category: newCategory, 
        subCategory: newSubCategory, 
        order: { $gte: newIndex },
        _id: { $ne: resourceId }
      },
      { $inc: { order: 1 } }
    );

    // Set the new order for the moved resource
    resource.order = newIndex;
    await resource.save();

    // Normalize orders within the new category and subcategory
    const resourcesInNewSubCategory = await Resource.find({ category: newCategory, subCategory: newSubCategory }).sort('order');
    for (let i = 0; i < resourcesInNewSubCategory.length; i++) {
      resourcesInNewSubCategory[i].order = i;
      await resourcesInNewSubCategory[i].save();
    }

    // If the category or subcategory has changed, normalize orders in the old category and subcategory
    if (oldCategory !== newCategory || oldSubCategory !== newSubCategory) {
      const resourcesInOldSubCategory = await Resource.find({ category: oldCategory, subCategory: oldSubCategory }).sort('order');
      for (let i = 0; i < resourcesInOldSubCategory.length; i++) {
        resourcesInOldSubCategory[i].order = i;
        await resourcesInOldSubCategory[i].save();
      }
    }

    const updatedResources = await Resource.find({
      category: newCategory,
      subCategory: newSubCategory
    }).sort('order');

    return {
      statusCode: 200,
      body: JSON.stringify(updatedResources)
    };
  } catch (error) {
    console.error('Error in updateResourceOrder:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message, stack: error.stack })
    };
  }
};
