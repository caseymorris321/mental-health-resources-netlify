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
    const { newIndex } = JSON.parse(event.body);

    const resource = await Resource.findById(id);
    if (!resource) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Resource not found' })
      };
    }

    const oldIndex = resource.order;

    // Update orders
    if (newIndex > oldIndex) {
      await Resource.updateMany(
        { 
          category: resource.category, 
          subCategory: resource.subCategory, 
          order: { $gt: oldIndex, $lte: newIndex } 
        },
        { $inc: { order: -1 } }
      );
    } else if (newIndex < oldIndex) {
      await Resource.updateMany(
        { 
          category: resource.category, 
          subCategory: resource.subCategory, 
          order: { $gte: newIndex, $lt: oldIndex } 
        },
        { $inc: { order: 1 } }
      );
    }

    resource.order = newIndex;
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
