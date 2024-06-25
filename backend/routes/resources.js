const express = require('express');
const { 
  getCategories, addCategory, updateCategory, deleteCategory, moveCategory
} = require('../controllers/categoryController');
const { 
  getSubCategories, addSubCategory, updateSubCategory, deleteSubCategory, moveSubCategory
} = require('../controllers/subCategoryController');
const requireAuth = require('../middleware/requireAuth');
const {
  createResource,
  getResources,
  getResource,
  deleteResource,
  updateResource,
  moveResource

} = require('../controllers/resourceController');

const router = express.Router();

// Public routes
router.get('/all', async (req, res) => {
  try {
    const categories = await Category.find();
    const subCategories = await SubCategory.find();
    const resources = await Resource.find();
    res.json({ categories, subCategories, resources });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', getResources);
router.get('/categories', getCategories);
router.get('/subcategories', getSubCategories);
router.get('/:id', getResource);

// Protected routes
router.use(requireAuth);

router.post('/categories', addCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.post('/subcategories', addSubCategory);
router.put('/subcategories/:id', updateSubCategory);
router.delete('/subcategories/:id', deleteSubCategory);

router.post('/', createResource);
router.delete('/:id', deleteResource);
router.put('/:id', updateResource);

router.put('/categories/:id/move/:direction', moveCategory);
router.put('/subcategories/:id/move/:direction', moveSubCategory);
router.put('/:id/move/:direction', moveResource);

module.exports = router;