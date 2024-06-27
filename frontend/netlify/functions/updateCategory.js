const { getConnection, closeConnection } = require('./db');
const { Category, SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();
    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const { name, oldName } = JSON.parse(event.body);

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Category not found' })
      };
    }

    await Promise.all([
      SubCategory.updateMany(
        { category: oldName },
        { category: name }
      ),
      Resource.updateMany(
        { category: oldName },
        { category: name }
      )
    ]);

    const [updatedSubCategories, updatedResources] = await Promise.all([
      SubCategory.find({ category: name }),
      Resource.find({ category: name })
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        category: updatedCategory,
        subCategories: updatedSubCategories,
        resources: updatedResources
      })
    };
  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Stack trace:', error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  } 
};