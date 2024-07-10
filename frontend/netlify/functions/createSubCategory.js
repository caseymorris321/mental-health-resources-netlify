const { getConnection, closeConnection } = require('./db');
const { SubCategory } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    await getConnection();

    const body = JSON.parse(event.body);

    const existingSubCategory = await SubCategory.findOne({ 
      name: body.name,
      category: body.category,
      isDeleted: false
    });

    if (existingSubCategory) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'A subcategory with this name already exists in this category.' })
      };
    }

    const maxOrderSubCategory = await SubCategory.findOne({ category: body.category }).sort('-order');
    const newOrder = maxOrderSubCategory ? maxOrderSubCategory.order + 1 : 0;
    const subCategory = new SubCategory({
      ...body,
      order: newOrder,
      isDeleted: false
    });
    const newSubCategory = await subCategory.save();
    return {
      statusCode: 201,
      body: JSON.stringify(newSubCategory)
    };
  } catch (error) {
    console.error('Detailed error in createSubCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message, stack: error.stack })
    };
  } 
};
