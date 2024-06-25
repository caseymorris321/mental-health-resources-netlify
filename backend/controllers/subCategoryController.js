const mongoose = require('mongoose');
const { SubCategory, Resource } = require('../models/resourceModel');

const getSubCategories = async (req, res) => {
    try {
        const subCategories = await SubCategory.find().sort({ category: 1, order: 1 });
        res.json(subCategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addSubCategory = async (req, res) => {
    try {
      const maxOrderSubCategory = await SubCategory.findOne({ category: req.body.category }).sort('-order');
      const newOrder = maxOrderSubCategory ? maxOrderSubCategory.order + 1 : 0;
      const subCategory = new SubCategory({
        ...req.body,
        order: newOrder
      });
      const newSubCategory = await subCategory.save();
      res.status(201).json(newSubCategory);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

const updateSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, oldName, category } = req.body;

        const updatedSubCategory = await SubCategory.findByIdAndUpdate(
            id,
            { name, category },
            { new: true, runValidators: true }
        );

        if (!updatedSubCategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        await Resource.updateMany(
            { subCategory: oldName, category: category },
            { subCategory: name }
        );

        const updatedResources = await Resource.find({ subCategory: name, category: category });

        res.json({
            subCategory: updatedSubCategory,
            resources: updatedResources
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteSubCategory = async (req, res) => {
    try {
        const subCategory = await SubCategory.findByIdAndDelete(req.params.id);
        if (!subCategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }
        res.json({ message: 'Subcategory deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const moveSubCategory = async (req, res) => {
    const { id, direction } = req.params;
    try {
      const subCategory = await SubCategory.findById(id);
      if (!subCategory) {
        return res.status(404).json({ message: 'Subcategory not found' });
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
        // If there's no adjacent subcategory, move to the start or end
        const extremeSubCategory = await SubCategory.findOne({ category: subCategory.category }).sort({ order: direction === 'up' ? 1 : -1 });
        if (extremeSubCategory && extremeSubCategory._id.toString() !== subCategory._id.toString()) {
          subCategory.order = direction === 'up' ? extremeSubCategory.order - 1 : extremeSubCategory.order + 1;
          await subCategory.save();
        }
      }
  
      // ensure orders are sequential and start from 0
      const allSubCategories = await SubCategory.find({ category: subCategory.category }).sort('order');
      for (let i = 0; i < allSubCategories.length; i++) {
        allSubCategories[i].order = i;
        await allSubCategories[i].save();
      }
  
      const updatedSubCategories = await SubCategory.find({ category: subCategory.category }).sort('order');
      console.log('Sending updated subcategories:', updatedSubCategories);
      res.json(updatedSubCategories);
    } catch (error) {
      console.error('Error in moveSubCategory:', error);
      res.status(500).json({ message: error.message });
    }
  };

module.exports = {
    getSubCategories,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    moveSubCategory
};