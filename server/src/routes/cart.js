const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require('../controllers/cart');
const { protect, customerOnly } = require('../middleware/auth');

router.route('/')
    .get(protect, customerOnly, getCart)
    .post(protect, customerOnly, addToCart)
    .delete(protect, customerOnly, clearCart);

router.route('/:productId')
    .put(protect, customerOnly, updateCartItem)
    .delete(protect, customerOnly, removeFromCart);

module.exports = router; 