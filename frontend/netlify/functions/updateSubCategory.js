const mongoose = require('mongoose');
const { SubCategory, Resource } = require('./models/resourceModel');

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
    const { name, oldName, category } = JSON.parse(event.body);

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      id,
      { name, category },
      { new: true, runValidators: true }
    );

    if (!updatedSubCategory) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Subcategory not found' })
      };
    }

    const [updatedResourcesResult] = await Promise.all([
      Resource.updateMany(
        { subCategory: oldName, category: category },
        { subCategory: name }
      ),
      Resource.find({ subCategory: name, category: category })
    ]);

    const updatedResources = updatedResourcesResult;

    return {
      statusCode: 200,
      body: JSON.stringify({
        subCategory: updatedSubCategory,
        resources: updatedResources
      })
    };
  } catch (error) {
    console.error('Error in updateSubCategory:', error);
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