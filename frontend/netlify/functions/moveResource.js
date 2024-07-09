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
    const direction = pathParts[pathParts.length - 1];

    const { newCategory, newSubCategory } = JSON.parse(event.body);

    const resource = await Resource.findById(id);
    if (!resource) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Resource not found' }) };
    }

    const oldCategory = resource.category;
    const oldSubCategory = resource.subCategory;

    // Update category and subcategory if provided
    if (newCategory && newSubCategory) {
      resource.category = newCategory;
      resource.subCategory = newSubCategory;
    }

    // Find the new position for the resource
    const lastResource = await Resource.findOne({
      category: resource.category,
      subCategory: resource.subCategory
    }).sort('-order');

    resource.order = lastResource ? lastResource.order + 1 : 0;
    await resource.save();

    // Reorder resources in the new category/subcategory
    const allResources = await Resource.find({
      category: resource.category,
      subCategory: resource.subCategory
    }).sort('order');
    for (let i = 0; i < allResources.length; i++) {
      allResources[i].order = i;
      await allResources[i].save();
    }

    // Reorder resources in the old category/subcategory if it changed
    if (oldCategory !== resource.category || oldSubCategory !== resource.subCategory) {
      const oldResources = await Resource.find({
        category: oldCategory,
        subCategory: oldSubCategory
      }).sort('order');
      for (let i = 0; i < oldResources.length; i++) {
        oldResources[i].order = i;
        await oldResources[i].save();
      }
    }

    const updatedResources = await Resource.find().sort('category subCategory order');
    return { statusCode: 200, body: JSON.stringify(updatedResources) };
  } catch (error) {
    console.error('Error in moveResource:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};
