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

    const oldCategory = resource.category;
    const oldSubCategory = resource.subCategory;
    const oldIndex = resource.order;

    // Update category and subcategory if changed
    if (newCategory && newSubCategory) {
      resource.category = newCategory;
      resource.subCategory = newSubCategory;
    }

    // If moving within the same subcategory
    if (oldCategory === resource.category && oldSubCategory === resource.subCategory) {
      if (newIndex > oldIndex) {
        await Resource.updateMany(
          { category: resource.category, subCategory: resource.subCategory, order: { $gt: oldIndex, $lte: newIndex } },
          { $inc: { order: -1 } }
        );
      } else if (newIndex < oldIndex) {
        await Resource.updateMany(
          { category: resource.category, subCategory: resource.subCategory, order: { $gte: newIndex, $lt: oldIndex } },
          { $inc: { order: 1 } }
        );
      }
    } else {
      // Moving to a different subcategory
      await Resource.updateMany(
        { category: oldCategory, subCategory: oldSubCategory, order: { $gt: oldIndex } },
        { $inc: { order: -1 } }
      );

      await Resource.updateMany(
        { category: resource.category, subCategory: resource.subCategory, order: { $gte: newIndex } },
        { $inc: { order: 1 } }
      );
    }

    resource.order = newIndex;
    await resource.save();

    // Normalize orders in both old and new subcategories
    const subcategoriesToNormalize = [
      { category: oldCategory, subCategory: oldSubCategory },
      { category: resource.category, subCategory: resource.subCategory }
    ];

    for (const { category, subCategory } of subcategoriesToNormalize) {
      const resources = await Resource.find({ category, subCategory }).sort('order');
      for (let i = 0; i < resources.length; i++) {
        resources[i].order = i;
        await resources[i].save();
      }
    }

    const updatedResources = await Resource.find().sort('category subCategory order');
    return { statusCode: 200, body: JSON.stringify(updatedResources) };
  } catch (error) {
    console.error('Error in moveResource:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};
