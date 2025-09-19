const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    getCategories,
    getSearchSuggestions
} = require('../controllers/products');
const { protect, authorize } = require('../middleware/auth');

// Specific routes must come before parameterized routes
router.get('/categories', getCategories);
router.get('/suggestions', getSearchSuggestions);
router.get('/low-stock', protect, authorize('admin'), getLowStockProducts);

router.route('/')
    .get(getProducts)
    .post(protect, authorize('admin'), createProduct);

router.route('/:id')
    .get(getProduct)
    .put(protect, authorize('admin'), updateProduct)
    .delete(protect, authorize('admin'), deleteProduct);

module.exports = router; 