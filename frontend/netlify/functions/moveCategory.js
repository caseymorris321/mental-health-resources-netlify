const { getConnection, closeConnection } = require('./db');
const { Category } = require('./models/resourceModel');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PATCH' && event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const pathParts = event.path.split('/');
    const id = pathParts[pathParts.length - 2];
    const direction = pathParts[pathParts.length - 1];

    const category = await Category.findById(id);
    if (!category || category.isDeleted) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Category not found' })
      };
    }

    const operator = direction === 'up' ? '$lt' : '$gt';
    const sort = direction === 'up' ? -1 : 1;

    const adjacentCategory = await Category.findOne({ 
      order: { [operator]: category.order },
      isDeleted: false
    }).sort({ order: sort });

    if (adjacentCategory) {
      const tempOrder = category.order;
      category.order = adjacentCategory.order;
      adjacentCategory.order = tempOrder;

      await Promise.all([category.save(), adjacentCategory.save()]);
    } else {
      const extremeCategory = await Category.findOne({ isDeleted: false })
        .sort({ order: direction === 'up' ? 1 : -1 });
      if (extremeCategory && extremeCategory._id.toString() !== category._id.toString()) {
        category.order = direction === 'up' ? extremeCategory.order - 1 : extremeCategory.order + 1;
        await category.save();
      }
    }

    const allCategories = await Category.find({ isDeleted: false }).sort('order');
    for (let i = 0; i < allCategories.length; i++) {
      allCategories[i].order = i;
      await allCategories[i].save();
    }

    const updatedCategories = await Category.find({ isDeleted: false }).sort('order');
    return {
      statusCode: 200,
      body: JSON.stringify(updatedCategories)
    };
  } catch (error) {
    console.error('Error in moveCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};
