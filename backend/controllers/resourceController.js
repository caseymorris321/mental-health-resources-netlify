const { Resource } = require('../models/resourceModel')

// Get all resources
const getResources = async (req, res) => {
  try {
    console.log('Attempting to fetch resources...');
    const resources = await Resource.find({}).sort({ category: 1, subCategory: 1, order: 1 });
    res.json(resources);
  } catch (error) {
    console.error('Error in getResources:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// Get a single resource
const getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Create a new resource
const createResource = async (req, res) => {
  try {
    const maxOrderResource = await Resource.findOne({ 
      category: req.body.category,
      subCategory: req.body.subCategory 
    }).sort('-order');
    const newOrder = maxOrderResource ? maxOrderResource.order + 1 : 0;
    const resource = new Resource({
      ...req.body,
      order: newOrder
    });
    const newResource = await resource.save();
    res.status(201).json(newResource);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a resource
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update a resource
const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

const moveResource = async (req, res) => {
  const { id, direction } = req.params;
  try {
    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
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
    res.json(updatedResources);
  } catch (error) {
    console.error('Error in moveResource:', error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createResource,
  getResources,
  getResource,
  deleteResource,
  updateResource,
  moveResource
}