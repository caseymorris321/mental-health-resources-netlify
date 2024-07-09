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

    // Normalize orders within the category and subcategory
    const resourcesInSubCategory = await Resource.find({ category: newCategory, subCategory: newSubCategory }).sort('order');
    for (let i = 0; i < resourcesInSubCategory.length; i++) {
      resourcesInSubCategory[i].order = i;
      await resourcesInSubCategory[i].save();
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
