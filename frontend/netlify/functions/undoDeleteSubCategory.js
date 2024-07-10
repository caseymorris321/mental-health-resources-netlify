const { getConnection } = require('./db');
const { SubCategory, Resource } = require('./models/resourceModel');

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
  
    try {
      await getConnection();
  
      if (event.httpMethod !== 'PUT') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
      }
  
      const subCategoryId = event.path.split('/').pop();
  
      const subCategory = await SubCategory.findByIdAndUpdate(
        subCategoryId,
        { isDeleted: false },
        { new: true }
      );
  
      if (!subCategory) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Subcategory not found' }) };
      }
  
      const resources = await Resource.updateMany(
        { category: subCategory.category, subCategory: subCategory.name, isDeleted: true },
        { isDeleted: false }
      );
  
      // Fetch the updated resources
      const updatedResources = await Resource.find({ category: subCategory.category, subCategory: subCategory.name, isDeleted: false });
  
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          subCategory, 
          resources: updatedResources // This ensures resources is always an array
        }),
      };
    } catch (error) {
      console.error('Error in undoDeleteSubCategory:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to undo delete subcategory' }) };
    }
  };
  