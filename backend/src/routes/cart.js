const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
    getCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart,
    validateCart,
    convertToOrderItems
} = require('../controllers/cartController');

// Apply rate limiting to all cart routes
router.use(apiLimiter);

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Public (allows guest carts)
 */
router.get('/', optionalAuth, getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Public (allows guest carts)
 * @body    { productId, variantId, quantity }
 */
router.post('/add', optionalAuth, addToCart);

/**
 * @route   PUT /api/cart/update
 * @desc    Update cart item quantity
 * @access  Public (allows guest carts)
 * @body    { itemId, quantity }
 */
router.put('/update', optionalAuth, updateCart);

/**
 * @route   DELETE /api/cart/remove/:itemId
 * @desc    Remove item from cart
 * @access  Public (allows guest carts)
 */
router.delete('/remove/:itemId', optionalAuth, removeFromCart);

/**
 * @route   POST /api/cart/clear
 * @desc    Clear cart
 * @access  Public (allows guest carts)
 */
router.post('/clear', optionalAuth, clearCart);

/**
 * @route   GET /api/cart/validate
 * @desc    Validate cart items (check availability, prices)
 * @access  Private (Authenticated users only)
 */
router.get('/validate', authenticate, validateCart);

/**
 * @route   POST /api/cart/convert-to-order
 * @desc    Convert cart items to order format
 * @access  Private (Authenticated users only)
 */
router.post('/convert-to-order', authenticate, convertToOrderItems);

module.exports = router;