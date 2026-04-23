const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, restoreProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/', protect, getProducts);
router.post('/', protect, requireRole('Administrator'), createProduct);
router.patch('/:id', protect, requireRole('Administrator'), updateProduct);
router.delete('/:id', protect, requireRole('Administrator'), deleteProduct);
router.patch('/:id/restore', protect, requireRole('Administrator'), restoreProduct);

module.exports = router;
