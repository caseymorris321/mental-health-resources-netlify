const { getConnection } = require('./db');
const { Category, SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const category = await Category.findByIdAndUpdate(id, { isDeleted: false }, { new: true });

    if (!category) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Category not found' }) };
    }

    const subCategories = await SubCategory.find({ category: category.name, isDeleted: true });
    const subCategoryIds = subCategories.map(sc => sc._id);

    await SubCategory.updateMany(
      { _id: { $in: subCategoryIds } },
      { isDeleted: false }
    );

    const resources = await Resource.find({
      $or: [
        { category: category.name, isDeleted: true },
        { subCategory: { $in: subCategories.map(sc => sc.name) }, isDeleted: true }
      ]
    });
    const resourceIds = resources.map(r => r._id);

    await Resource.updateMany(
      { _id: { $in: resourceIds } },
      { isDeleted: false }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        category,
        subCategories: await SubCategory.find({ _id: { $in: subCategoryIds } }),
        resources: await Resource.find({ _id: { $in: resourceIds } })
      })
    };
  } catch (error) {
    console.error('Error in undoDeleteCategory:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to undo delete category' }) };
  }
};
