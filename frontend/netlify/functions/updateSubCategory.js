const { SubCategory, Resource } = require('./models/resourceModel');
const authMiddleware = require('./middleware/requireAuth');

const handler = async (event, context, auth) => {
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const id = event.path.split('/').pop();
    const { name, oldName, category } = JSON.parse(event.body);

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      id,
      { name, category },
      { new: true, runValidators: true }
    );

    if (!updatedSubCategory) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Subcategory not found' })
      };
    }

    await Resource.updateMany(
      { subCategory: oldName, category: category },
      { subCategory: name }
    );

    const updatedResources = await Resource.find({ subCategory: name, category: category });

    return {
      statusCode: 200,
      body: JSON.stringify({
        subCategory: updatedSubCategory,
        resources: updatedResources
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message })
    };
  }
};

exports.handler = authMiddleware(handler);