const mongoose = require('mongoose');
const { Category, SubCategory, Resource } = require('../models/resourceModel');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort('order');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCategory = async (req, res) => {
  try {
    const maxOrderCategory = await Category.findOne().sort('-order');
    const newOrder = maxOrderCategory ? maxOrderCategory.order + 1 : 0;
    const category = new Category({
      ...req.body,
      order: newOrder
    });
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, oldName } = req.body;

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name },
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await SubCategory.updateMany(
            { category: oldName },
            { category: name }
        );

        await Resource.updateMany(
            { category: oldName },
            { category: name }
        );

        const updatedSubCategories = await SubCategory.find({ category: name });
        const updatedResources = await Resource.find({ category: name });

        res.json({
            category: updatedCategory,
            subCategories: updatedSubCategories,
            resources: updatedResources
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const moveCategory = async (req, res) => {
  const { id, direction } = req.params;
  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
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
      // If there's no adjacent category, move to the start or end
      const extremeCategory = await Category.findOne().sort({ order: direction === 'up' ? 1 : -1 });
      if (extremeCategory && extremeCategory._id.toString() !== category._id.toString()) {
        category.order = direction === 'up' ? extremeCategory.order - 1 : extremeCategory.order + 1;
        await category.save();
      }
    }

    // Normalize orders to ensure they are sequential and start from 0
    const allCategories = await Category.find().sort('order');
    for (let i = 0; i < allCategories.length; i++) {
      allCategories[i].order = i;
      await allCategories[i].save();
    }

    const updatedCategories = await Category.find().sort('order');
    console.log('Sending updated categories:', updatedCategories);
    res.json(updatedCategories);
  } catch (error) {
    console.error('Error in moveCategory:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  moveCategory
};