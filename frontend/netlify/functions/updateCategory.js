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
    const { name, oldName } = JSON.parse(event.body);

    const existingCategory = await Category.findOne({ name, isDeleted: false, _id: { $ne: id } });
    if (existingCategory) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'A category with this name already exists.' })
      };
    }

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

    await SubCategory.updateMany({ category: oldName }, { category: name });
    await Resource.updateMany({ category: oldName }, { category: name });

    const updatedSubCategories = await SubCategory.find({ category: name });
    const updatedResources = await Resource.find({ category: name });

    return {
      statusCode: 200,
      body: JSON.stringify({
        category: updatedCategory,
        subCategories: updatedSubCategories,
        resources: updatedResources
      })
    };
  } catch (error) {
    console.error('Error in updateCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  } 
};
