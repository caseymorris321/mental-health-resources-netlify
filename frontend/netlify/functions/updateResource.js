const { getConnection, closeConnection } = require('./db');
const { Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();
    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const body = JSON.parse(event.body);

    // Check for existing resource with the same name, category, and subCategory
    const existingResource = await Resource.findOne({ 
      name: new RegExp(`^${body.name}$`, 'i'),
      category: body.category, 
      subCategory: body.subCategory,
      _id: { $ne: id }
    });

    if (existingResource) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: `A resource with the name "${body.name}" already exists in the "${body.category}" category and "${body.subCategory}" subcategory.` })
      };
    }

    // If no duplicate found, proceed with the update
    const resource = await Resource.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!resource) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Resource not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(resource)
    };
  } catch (error) {
    console.error('Error in updateResource:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message })
    };
  } 
};