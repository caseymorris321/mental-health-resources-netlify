const { getConnection } = require('./db');
const { Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { resourceId, newIndex, newCategory, newSubCategory } = JSON.parse(event.body);

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Resource not found' }) };
    }

    // Update category and subcategory if changed
    resource.category = newCategory;
    resource.subCategory = newSubCategory;

    // Update orders
    await Resource.updateMany(
      { 
        category: newCategory, 
        subCategory: newSubCategory, 
        order: { $gte: newIndex } 
      },
      { $inc: { order: 1 } }
    );

    resource.order = newIndex;
    await resource.save();

    // Normalize orders
    const allResources = await Resource.find().sort('category subCategory order');
    for (let i = 0; i < allResources.length; i++) {
      allResources[i].order = i;
      await allResources[i].save();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Resource order updated successfully' })
    };
  } catch (error) {
    console.error('Error in updateResourceOrder:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};
