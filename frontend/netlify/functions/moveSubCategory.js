const { getConnection } = require('./db');
const { SubCategory } = require('./models/resourceModel');

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

    const subCategory = await SubCategory.findOne({ _id: id, isDeleted: false });
    if (!subCategory) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Subcategory not found' })
      };
    }

    const operator = direction === 'up' ? '$lt' : '$gt';
    const sort = direction === 'up' ? -1 : 1;

    const adjacentSubCategory = await SubCategory.findOne({
      category: subCategory.category,
      order: { [operator]: subCategory.order },
      isDeleted: false
    }).sort({ order: sort });

    if (adjacentSubCategory) {
      const tempOrder = subCategory.order;
      subCategory.order = adjacentSubCategory.order;
      adjacentSubCategory.order = tempOrder;

      await Promise.all([subCategory.save(), adjacentSubCategory.save()]);
    } else {
      const extremeSubCategory = await SubCategory.findOne({ category: subCategory.category, isDeleted: false })
        .sort({ order: direction === 'up' ? 1 : -1 });
      if (extremeSubCategory && extremeSubCategory._id.toString() !== subCategory._id.toString()) {
        subCategory.order = direction === 'up' ? extremeSubCategory.order - 1 : extremeSubCategory.order + 1;
        await subCategory.save();
      }
    }

    const allSubCategories = await SubCategory.find({ category: subCategory.category, isDeleted: false }).sort('order');
    for (let i = 0; i < allSubCategories.length; i++) {
      allSubCategories[i].order = i;
      await allSubCategories[i].save();
    }

    const updatedSubCategories = await SubCategory.find({ isDeleted: false }).sort('category order');
    return {
      statusCode: 200,
      body: JSON.stringify(updatedSubCategories)
    };
  } catch (error) {
    console.error('Error in moveSubCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message, stack: error.stack })
    };
  }
};
