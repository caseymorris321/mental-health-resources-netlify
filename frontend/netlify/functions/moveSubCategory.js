const { SubCategory } = require('../models/resourceModel');
const authMiddleware = require('./auth');

const handler = async (event, context, auth) => {
  if (event.httpMethod !== 'PATCH') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const pathParts = event.path.split('/');
    const id = pathParts[pathParts.length - 2];
    const direction = pathParts[pathParts.length - 1];

    const subCategory = await SubCategory.findById(id);
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
      order: { [operator]: subCategory.order } 
    }).sort({ order: sort });

    if (adjacentSubCategory) {
      const tempOrder = subCategory.order;
      subCategory.order = adjacentSubCategory.order;
      adjacentSubCategory.order = tempOrder;

      await Promise.all([subCategory.save(), adjacentSubCategory.save()]);
    } else {
      const extremeSubCategory = await SubCategory.findOne({ category: subCategory.category }).sort({ order: direction === 'up' ? 1 : -1 });
      if (extremeSubCategory && extremeSubCategory._id.toString() !== subCategory._id.toString()) {
        subCategory.order = direction === 'up' ? extremeSubCategory.order - 1 : extremeSubCategory.order + 1;
        await subCategory.save();
      }
    }

    const allSubCategories = await SubCategory.find({ category: subCategory.category }).sort('order');
    for (let i = 0; i < allSubCategories.length; i++) {
      allSubCategories[i].order = i;
      await allSubCategories[i].save();
    }

    const updatedSubCategories = await SubCategory.find({ category: subCategory.category }).sort('order');
    console.log('Sending updated subcategories:', updatedSubCategories);
    return {
      statusCode: 200,
      body: JSON.stringify(updatedSubCategories)
    };
  } catch (error) {
    console.error('Error in moveSubCategory:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};

exports.handler = authMiddleware(handler);