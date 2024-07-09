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
    const resourceId = pathParts[pathParts.length - 2];
    const { newIndex, newCategory, newSubCategory } = JSON.parse(event.body);

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Resource not found' }) };
    }

    const oldOrder = resource.order;
    const oldCategory = resource.category;
    const oldSubCategory = resource.subCategory;

    // Update category and subcategory
    resource.category = newCategory;
    resource.subCategory = newSubCategory;

    if (newCategory === oldCategory && newSubCategory === oldSubCategory) {
      // Moving within the same subcategory
      if (newIndex > oldOrder) {
        // Moving down
        await Resource.updateMany(
          { 
            category: newCategory, 
            subCategory: newSubCategory, 
            order: { $gt: oldOrder, $lte: newIndex },
            _id: { $ne: resourceId }
          },
          { $inc: { order: -1 } }
        );
      } else if (newIndex < oldOrder) {
        // Moving up
        await Resource.updateMany(
          { 
            category: newCategory, 
            subCategory: newSubCategory, 
            order: { $gte: newIndex, $lt: oldOrder },
            _id: { $ne: resourceId }
          },
          { $inc: { order: 1 } }
        );
      }
    } else {
      // Moving to a different subcategory
      await Resource.updateMany(
        { 
          category: newCategory, 
          subCategory: newSubCategory, 
          order: { $gte: newIndex },
          _id: { $ne: resourceId }
        },
        { $inc: { order: 1 } }
      );

      // Adjust orders in the old subcategory
      await Resource.updateMany(
        {
          category: oldCategory,
          subCategory: oldSubCategory,
          order: { $gt: oldOrder }
        },
        { $inc: { order: -1 } }
      );
    }

    // Set the new order for the moved resource
    resource.order = newIndex;
    await resource.save();

    // Normalize orders within the new subcategory
    const resourcesInNewSubCategory = await Resource.find({ category: newCategory, subCategory: newSubCategory }).sort('order');
    for (let i = 0; i < resourcesInNewSubCategory.length; i++) {
      resourcesInNewSubCategory[i].order = i;
      await resourcesInNewSubCategory[i].save();
    }

    // If the subcategory has changed, normalize orders in the old subcategory
    if (oldCategory !== newCategory || oldSubCategory !== newSubCategory) {
      const resourcesInOldSubCategory = await Resource.find({ category: oldCategory, subCategory: oldSubCategory }).sort('order');
      for (let i = 0; i < resourcesInOldSubCategory.length; i++) {
        resourcesInOldSubCategory[i].order = i;
        await resourcesInOldSubCategory[i].save();
      }
    }

    // Fetch all resources to return updated state
    const allResources = await Resource.find().sort('category subCategory order');

    return {
      statusCode: 200,
      body: JSON.stringify(allResources)
    };
  } catch (error) {
    console.error('Error in updateResourceOrder:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message, stack: error.stack })
    };
  }
};
