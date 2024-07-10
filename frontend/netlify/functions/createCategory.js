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
    let category = await Category.findOne({ name: body.name });
    
    if (category) {
      if (category.isDeleted) {
        // If the category exists but is deleted, restore it
        category.isDeleted = false;
        await category.save();
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Category restored', category })
        };
      } else {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'A category with this name already exists.' })
        };
      }
    }

    const maxOrderCategory = await Category.findOne().sort('-order');
    const newOrder = maxOrderCategory ? maxOrderCategory.order + 1 : 0;
    category = new Category({
      ...body,
      order: newOrder,
      isDeleted: false
    });
    const newCategory = await category.save();
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
