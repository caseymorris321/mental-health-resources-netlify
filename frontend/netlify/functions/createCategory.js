const { getConnection } = require('./db');
const { Category, SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const body = JSON.parse(event.body);
    
    // Check for any active category with this name
    const existingActiveCategory = await Category.findOne({ name: body.name, isDeleted: false });
    
    if (existingActiveCategory) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'An active category with this name already exists.' })
      };
    }

    // Check for a deleted category with this name
    const existingDeletedCategory = await Category.findOne({ name: body.name, isDeleted: true });

    if (existingDeletedCategory) {
      // If it exists and is deleted, permanently delete it and its associated data
      await Category.deleteOne({ _id: existingDeletedCategory._id });
      await SubCategory.deleteMany({ category: body.name });
      await Resource.deleteMany({ category: body.name });
    }

    // Create a new category
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
