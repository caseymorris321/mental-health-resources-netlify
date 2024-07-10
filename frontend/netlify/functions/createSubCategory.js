const { getConnection } = require('./db');
const { SubCategory, Category } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { name, category, categoryId } = JSON.parse(event.body);

    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Category not found' })
      };
    }

    const existingSubCategory = await SubCategory.findOne({
      name,
      category,
      isDeleted: false
    });

    if (existingSubCategory) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'A subcategory with this name already exists in this category.' })
      };
    }

    const maxOrderSubCategory = await SubCategory.findOne({ category }).sort('-order');
    const newOrder = maxOrderSubCategory ? maxOrderSubCategory.order + 1 : 0;

    const newSubCategory = new SubCategory({
      name,
      category,
      categoryId,
      order: newOrder,
      isDeleted: false
    });

    await newSubCategory.save();

    return {
      statusCode: 201,
      body: JSON.stringify(newSubCategory)
    };
  } catch (error) {
    console.error('Error in createSubCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};
