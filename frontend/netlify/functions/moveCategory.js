const mongoose = require('mongoose');
const { Category } = require('./models/resourceModel');

let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }
  
  const db = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  cachedDb = db;
  return db;
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectToDatabase();

    if (event.httpMethod !== 'PATCH') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const pathParts = event.path.split('/');
    const id = pathParts[pathParts.length - 2];
    const direction = pathParts[pathParts.length - 1];

    const category = await Category.findById(id);
    if (!category) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Category not found' })
      };
    }

    const operator = direction === 'up' ? '$lt' : '$gt';
    const sort = direction === 'up' ? -1 : 1;

    const adjacentCategory = await Category.findOne({ order: { [operator]: category.order } })
      .sort({ order: sort });

    if (adjacentCategory) {
      const tempOrder = category.order;
      category.order = adjacentCategory.order;
      adjacentCategory.order = tempOrder;

      await Promise.all([category.save(), adjacentCategory.save()]);
    } else {
      const extremeCategory = await Category.findOne().sort({ order: direction === 'up' ? 1 : -1 });
      if (extremeCategory && extremeCategory._id.toString() !== category._id.toString()) {
        category.order = direction === 'up' ? extremeCategory.order - 1 : extremeCategory.order + 1;
        await category.save();
      }
    }

    const allCategories = await Category.find().sort('order');
    for (let i = 0; i < allCategories.length; i++) {
      allCategories[i].order = i;
      await allCategories[i].save();
    }

    const updatedCategories = await Category.find().sort('order');
    console.log('Sending updated categories:', updatedCategories);
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
  } finally {
    if (cachedDb) {
      await cachedDb.disconnect();
    }
  }
};