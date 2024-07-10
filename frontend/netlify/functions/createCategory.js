const { getConnection } = require('./db');
const { Category } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const body = JSON.parse(event.body);
    
    // Check for existing non-deleted category with the same name
    const existingCategory = await Category.findOne({ name: body.name, isDeleted: false });
    
    if (existingCategory) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'A category with this name already exists.' })
      };
    }

    // Create a new category, regardless of whether a deleted one exists
    const maxOrderCategory = await Category.findOne().sort('-order');
    const newOrder = maxOrderCategory ? maxOrderCategory.order + 1 : 0;
    const newCategory = new Category({
      ...body,
      order: newOrder,
      isDeleted: false
    });
    await newCategory.save();
    
    return {
      statusCode: 201,
      body: JSON.stringify(newCategory)
    };
  } catch (error) {
    console.error('Error in createCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  } 
};
