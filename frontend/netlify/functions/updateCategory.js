const mongoose = require('mongoose');
const { Category, SubCategory, Resource } = require('./models/resourceModel');

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

    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const id = event.path.split('/').pop();
    const { name, oldName } = JSON.parse(event.body);

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Category not found' })
      };
    }

    await Promise.all([
      SubCategory.updateMany(
        { category: oldName },
        { category: name }
      ),
      Resource.updateMany(
        { category: oldName },
        { category: name }
      )
    ]);

    const [updatedSubCategories, updatedResources] = await Promise.all([
      SubCategory.find({ category: name }),
      Resource.find({ category: name })
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        category: updatedCategory,
        subCategories: updatedSubCategories,
        resources: updatedResources
      })
    };
  } catch (error) {
    console.error('Error in updateCategory:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message })
    };
  } finally {
    if (cachedDb) {
      await cachedDb.disconnect();
    }
  }
};