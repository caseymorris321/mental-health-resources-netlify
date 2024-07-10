const { getConnection } = require('./db');
const { SubCategory } = require('./models/resourceModel');
const mongoose = require('mongoose');

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await getConnection();

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { subCategoryId, direction } = JSON.parse(event.body);

    if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid subcategory ID' })
      };
    }

    const subCategory = await SubCategory.findOne({ _id: new mongoose.Types.ObjectId(subCategoryId), isDeleted: false });
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
      const extremeSubCategory = await SubCategory.findOne({ 
        category: subCategory.category, 
        isDeleted: false 
      }).sort({ order: direction === 'up' ? 1 : -1 });
      
      if (extremeSubCategory && extremeSubCategory._id.toString() !== subCategory._id.toString()) {
        subCategory.order = direction === 'up' ? extremeSubCategory.order - 1 : extremeSubCategory.order + 1;
        await subCategory.save();
      }
    }

    const allSubCategories = await SubCategory.find({ 
      category: subCategory.category, 
      isDeleted: false 
    }).sort('order');
    
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
