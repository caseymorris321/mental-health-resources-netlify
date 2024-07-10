const { getConnection } = require('./db');
const { SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const subCategory = await SubCategory.findByIdAndUpdate(id, { isDeleted: false }, { new: true });

    if (!subCategory) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Subcategory not found' }) };
    }

    const resources = await Resource.find({
      category: subCategory.category,
      subCategory: subCategory.name,
      isDeleted: true
    });
    const resourceIds = resources.map(r => r._id);

    await Resource.updateMany(
      { _id: { $in: resourceIds } },
      { isDeleted: false }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        subCategory,
        resources: await Resource.find({ _id: { $in: resourceIds } })
      })
    };
  } catch (error) {
    console.error('Error in undoDeleteSubCategory:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to undo delete subcategory' }) };
  }
};
