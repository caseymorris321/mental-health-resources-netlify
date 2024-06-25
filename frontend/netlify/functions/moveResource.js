const { Resource } = require('./models/resourceModel');
const authMiddleware = require('./middleware/requireAuth');

const handler = async (event, context, auth) => {
  if (event.httpMethod !== 'PATCH') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const pathParts = event.path.split('/');
  const id = pathParts[pathParts.length - 2];
  const direction = pathParts[pathParts.length - 1];

  try {
    const resource = await Resource.findById(id);
    if (!resource) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Resource not found' })
      };
    }

    const operator = direction === 'up' ? '$lt' : '$gt';
    const sort = direction === 'up' ? -1 : 1;

    const adjacentResource = await Resource.findOne({ 
      category: resource.category,
      subCategory: resource.subCategory,
      order: { [operator]: resource.order } 
    }).sort({ order: sort });

    if (adjacentResource) {
      const tempOrder = resource.order;
      resource.order = adjacentResource.order;
      adjacentResource.order = tempOrder;

      await Promise.all([resource.save(), adjacentResource.save()]);
    } else {
      // If there's no adjacent resource, move to the start or end
      const extremeResource = await Resource.findOne({ 
        category: resource.category,
        subCategory: resource.subCategory 
      }).sort({ order: direction === 'up' ? 1 : -1 });
      if (extremeResource && extremeResource._id.toString() !== resource._id.toString()) {
        resource.order = direction === 'up' ? extremeResource.order - 1 : extremeResource.order + 1;
        await resource.save();
      }
    }

    // ensure orders are sequential and start from 0
    const allResources = await Resource.find({ 
      category: resource.category,
      subCategory: resource.subCategory 
    }).sort('order');
    for (let i = 0; i < allResources.length; i++) {
      allResources[i].order = i;
      await allResources[i].save();
    }

    const updatedResources = await Resource.find({ 
      category: resource.category,
      subCategory: resource.subCategory 
    }).sort('order');
    console.log('Sending updated resources:', updatedResources);
    
    return {
      statusCode: 200,
      body: JSON.stringify(updatedResources)
    };
  } catch (error) {
    console.error('Error in moveResource:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};

exports.handler = authMiddleware(handler);