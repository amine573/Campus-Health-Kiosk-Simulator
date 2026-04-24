const express = require('express');
const router = express.Router();
const {
  getCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/',    protect, getCategories);
router.get('/all', protect, requireRole('Administrator'), getAllCategories);
router.post('/',   protect, requireRole('Administrator'), createCategory);
router.patch('/:id', protect, requireRole('Administrator'), updateCategory);
router.delete('/:id', protect, requireRole('Administrator'), deleteCategory);

module.exports = router;