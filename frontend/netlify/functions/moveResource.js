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
    const { newIndex, newCategory, newSubCategory } = JSON.parse(event.body);

    const resource = await Resource.findById(id);
    if (!resource) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Resource not found' })
      };
    }

    const oldCategory = resource.category;
    const oldSubCategory = resource.subCategory;

    // Update resource's category and subcategory
    resource.category = newCategory;
    resource.subCategory = newSubCategory;

    // Update orders in the new subcategory
    await Resource.updateMany(
      { category: newCategory, subCategory: newSubCategory, order: { $gte: newIndex } },
      { $inc: { order: 1 } }
    );

    resource.order = newIndex;
    await resource.save();

    // Normalize orders in the new subcategory
    const resourcesInNewSubCategory = await Resource.find({ category: newCategory, subCategory: newSubCategory }).sort('order');
    for (let i = 0; i < resourcesInNewSubCategory.length; i++) {
      resourcesInNewSubCategory[i].order = i;
      await resourcesInNewSubCategory[i].save();
    }

    // Normalize orders in the old subcategory if it's different
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
    console.error('Error in moveResource:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};
