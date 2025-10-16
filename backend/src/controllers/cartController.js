const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { logger, LoggingService } = require('../services/loggingService');
const ResponseUtils = require('../utils/response');

// Helper functions for responses
const successResponse = (data, message) => ({
    success: true,
    data,
    message
});

const errorResponse = (message, details = null) => ({
    success: false,
    error: {
        message,
        code: 'CART_ERROR',
        ...(details && { details })
    }
});

/**
 * Get user's cart
 * GET /api/cart
 */
const getCart = async (req, res) => {
    try {
        // Handle both authenticated and guest users
        let userId;
        if (req.user) {
            userId = req.user._id;
        } else {
            // For guest users, use IP address as identifier
            userId = `guest_${req.ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }

        logger.info('Fetching cart for user', {
            userId,
            correlationId: req.correlationId
        });

        let cart = await Cart.findByUserId(userId);

        if (!cart) {
            // Return empty cart structure instead of creating in database
            const emptyCart = {
                _id: null,
                user_id: userId,
                items: [],
                total_amount: 0,
                total_items: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_updated: new Date()
            };

            logger.info('Returning empty cart (no database entry)', {
                userId,
                correlationId: req.correlationId
            });

            return res.status(200).json({
                success: true,
                data: {
                    cart: emptyCart,
                    validation: {
                        isValid: true,
                        errors: []
                    }
                },
                message: 'Empty cart retrieved'
            });
        }

        // Validate cart items and update if necessary
        const validation = await cart.validateCart();

        if (validation.updatedItems) {
            logger.info('Cart items updated during validation', {
                userId,
                removedItems: validation.errors.length,
                correlationId: req.correlationId
            });
        }

        const response = {
            cart: {
                _id: cart._id,
                user_id: cart.user_id,
                items: cart.items,
                total_amount: cart.total_amount,
                total_items: cart.total_items,
                created_at: cart.created_at,
                updated_at: cart.updated_at,
                last_updated: cart.last_updated
            },
            validation: {
                isValid: validation.valid,
                errors: validation.errors
            }
        };

        // Debug logging for cart data
        logger.info('Cart retrieved successfully - Debug Data', {
            userId,
            itemCount: cart.total_items,
            totalAmount: cart.total_amount,
            actualItemsCount: cart.items.length,
            itemsData: cart.items.map(item => ({
                product_name: item.product_name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
                calculated_subtotal: item.price * item.quantity
            })),
            correlationId: req.correlationId
        });

        logger.info('Cart retrieved successfully', {
            userId,
            itemCount: cart.total_items,
            totalAmount: cart.total_amount,
            correlationId: req.correlationId
        });

        res.status(200).json({
            success: true,
            data: response,
            message: 'Cart retrieved successfully'
        });
    } catch (error) {
        logger.error('Error fetching cart', {
            userId: req.user?.userId,
            error: error.message,
            stack: error.stack,
            correlationId: req.correlationId
        });

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch cart',
                code: 'CART_FETCH_ERROR',
                details: error.message
            }
        });
    }
};

/**
 * Add item to cart
 * POST /api/cart/add
 */
const addToCart = async (req, res) => {
    try {
        // Handle both authenticated and guest users
        let userId;
        if (req.user) {
            userId = req.user._id;
        } else {
            // For guest users, use IP address as identifier
            userId = `guest_${req.ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }

        const { productId, variantId, quantity = 1 } = req.body;

        logger.info('Adding item to cart', {
            userId,
            productId,
            variantId,
            quantity,
            correlationId: req.correlationId
        });

        // Validate input
        if (!productId || !variantId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Product ID and Variant ID are required',
                    code: 'MISSING_REQUIRED_FIELDS'
                }
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Quantity must be greater than 0',
                    code: 'INVALID_QUANTITY'
                }
            });
        }

        // Verify product exists and is active
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                }
            });
        }

        if (!product.is_active) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Product is not available',
                    code: 'PRODUCT_UNAVAILABLE'
                }
            });
        }

        // Verify variant exists and is available
        const variant = await ProductVariant.findById(variantId);
        if (!variant || !variant.product_id.equals(productId)) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Product variant not found',
                    code: 'VARIANT_NOT_FOUND'
                }
            });
        }

        if (!variant.is_available) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Product variant is not available',
                    code: 'VARIANT_UNAVAILABLE'
                }
            });
        }

        // Prepare item data
        const itemData = {
            product_id: productId,
            product_name: product.name,
            variant_id: variantId,
            variant_size: variant.size,
            price: variant.price,
            quantity: parseInt(quantity),
            image: product.images && product.images.length > 0 ? product.images[0] : ''
        };

        // Add to cart
        const cart = await Cart.createOrUpdateCart(userId, itemData);

        logger.info('Item added to cart successfully', {
            userId,
            productId,
            variantId,
            quantity,
            totalItems: cart.total_items,
            totalAmount: cart.total_amount,
            correlationId: req.correlationId
        });

        const response = {
            cart: {
                _id: cart._id,
                user_id: cart.user_id,
                items: cart.items,
                total_amount: cart.total_amount,
                total_items: cart.total_items,
                created_at: cart.created_at,
                updated_at: cart.updated_at,
                last_updated: cart.last_updated
            },
            addedItem: itemData
        };

        res.status(201).json({
            success: true,
            data: response,
            message: 'Item added to cart successfully'
        });
    } catch (error) {
        logger.error('Error adding item to cart', {
            userId: req.user?.userId,
            productId: req.body?.productId,
            error: error.message,
            stack: error.stack,
            correlationId: req.correlationId
        });

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to add item to cart',
                code: 'CART_ADD_ERROR',
                details: error.message
            }
        });
    }
};

/**
 * Update cart item quantity
 * PUT /api/cart/update
 */
const updateCart = async (req, res) => {
    try {
        // Handle both authenticated and guest users
        let userId;
        if (req.user) {
            userId = req.user._id;
        } else {
            // For guest users, use IP address as identifier
            userId = `guest_${req.ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }

        const { itemId, quantity } = req.body;

        logger.info('Updating cart item', {
            userId,
            itemId,
            quantity,
            correlationId: req.correlationId
        });

        // Validate input
        if (!itemId) {
            return res.status(400).json(errorResponse('Item ID is required'));
        }

        if (quantity < 0) {
            return res.status(400).json(errorResponse('Quantity cannot be negative'));
        }

        // Find user's cart
        const cart = await Cart.findByUserId(userId);
        if (!cart) {
            return res.status(404).json(errorResponse('Cart not found'));
        }

        // Update item quantity - if quantity is 0, remove the item
        if (quantity === 0) {
            cart.removeItem(itemId);
        } else {
            cart.updateItem(itemId, quantity);
        }
        await cart.save();

        logger.info('Cart item updated successfully', {
            userId,
            itemId,
            quantity,
            totalItems: cart.total_items,
            totalAmount: cart.total_amount,
            correlationId: req.correlationId
        });

        const response = {
            cart: {
                _id: cart._id,
                user_id: cart.user_id,
                items: cart.items,
                total_amount: cart.total_amount,
                total_items: cart.total_items,
                created_at: cart.created_at,
                updated_at: cart.updated_at,
                last_updated: cart.last_updated
            }
        };

        res.status(200).json({
            success: true,
            data: response,
            message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully'
        });
    } catch (error) {
        logger.error('Error updating cart', {
            userId: req.user?.userId,
            itemId: req.body?.itemId,
            error: error.message,
            stack: error.stack,
            correlationId: req.correlationId
        });

        if (error.message === 'Item not found in cart') {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Item not found in cart',
                    code: 'ITEM_NOT_FOUND'
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update cart',
                code: 'CART_UPDATE_ERROR',
                details: error.message
            }
        });
    }
};

/**
 * Remove item from cart
 * DELETE /api/cart/remove/:itemId
 */
const removeFromCart = async (req, res) => {
    try {
        // Handle both authenticated and guest users
        let userId;
        if (req.user) {
            userId = req.user._id;
        } else {
            // For guest users, use IP address as identifier
            userId = `guest_${req.ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }

        const { itemId } = req.params;

        logger.info('Removing item from cart', {
            userId,
            itemId,
            correlationId: req.correlationId
        });

        // Validate input
        if (!itemId) {
            return res.status(400).json(errorResponse('Item ID is required'));
        }

        // Find user's cart
        const cart = await Cart.findByUserId(userId);
        if (!cart) {
            return res.status(404).json(errorResponse('Cart not found'));
        }

        // Check if item exists in cart
        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Item not found in cart',
                    code: 'ITEM_NOT_FOUND'
                }
            });
        }

        // Remove item
        cart.removeItem(itemId);
        await cart.save();

        logger.info('Item removed from cart successfully', {
            userId,
            itemId,
            totalItems: cart.total_items,
            totalAmount: cart.total_amount,
            correlationId: req.correlationId
        });

        const response = {
            cart: {
                _id: cart._id,
                user_id: cart.user_id,
                items: cart.items,
                total_amount: cart.total_amount,
                total_items: cart.total_items,
                created_at: cart.created_at,
                updated_at: cart.updated_at,
                last_updated: cart.last_updated
            }
        };

        res.status(200).json({
            success: true,
            data: response,
            message: 'Item removed from cart successfully'
        });
    } catch (error) {
        logger.error('Error removing item from cart', {
            userId: req.user?._id || `guest_${req.ip.replace(/[^a-zA-Z0-9]/g, '_')}`,
            itemId: req.params?.itemId,
            error: error.message,
            stack: error.stack,
            correlationId: req.correlationId
        });

        res.status(500).json(errorResponse('Failed to remove item from cart', error.message));
    }
};

/**
 * Clear cart
 * POST /api/cart/clear
 */
const clearCart = async (req, res) => {
    try {
        // Handle both authenticated and guest users
        let userId;
        if (req.user) {
            userId = req.user._id;
        } else {
            // For guest users, use IP address as identifier
            userId = `guest_${req.ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }

        logger.info('Clearing cart', {
            userId,
            correlationId: req.correlationId
        });

        // Find user's cart
        const cart = await Cart.findByUserId(userId);
        if (!cart) {
            return res.status(404).json(errorResponse('Cart not found'));
        }

        const itemCount = cart.total_items;

        // Clear cart
        cart.clearCart();
        await cart.save();

        logger.info('Cart cleared successfully', {
            userId,
            clearedItems: itemCount,
            correlationId: req.correlationId
        });

        const response = {
            cart: {
                _id: cart._id,
                user_id: cart.user_id,
                items: [],
                total_amount: 0,
                total_items: 0,
                created_at: cart.created_at,
                updated_at: cart.updated_at,
                last_updated: cart.last_updated
            }
        };

        res.status(200).json({
            success: true,
            data: response,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        logger.error('Error clearing cart', {
            userId: req.user?.userId,
            error: error.message,
            stack: error.stack,
            correlationId: req.correlationId
        });

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to clear cart',
                code: 'CART_CLEAR_ERROR',
                details: error.message
            }
        });
    }
};

/**
 * Validate cart
 * GET /api/cart/validate
 */
const validateCart = async (req, res) => {
    try {
        const userId = req.user._id;

        logger.info('Validating cart', {
            userId,
            correlationId: req.correlationId
        });

        // Find user's cart
        const cart = await Cart.findByUserId(userId);
        if (!cart) {
            return res.status(404).json(errorResponse('Cart not found'));
        }

        // Validate cart
        const validation = await cart.validateCart();

        logger.info('Cart validation completed', {
            userId,
            isValid: validation.isValid,
            errorCount: validation.errors.length,
            updatedItems: validation.updatedItems,
            correlationId: req.correlationId
        });

        const response = {
            isValid: validation.isValid,
            errors: validation.errors,
            updatedItems: validation.updatedItems,
            cart: {
                id: cart._id,
                items: cart.items,
                totalAmount: cart.totalAmount,
                totalItems: cart.totalItems,
                lastUpdated: cart.lastUpdated
            }
        };

        res.status(200).json({
            success: true,
            data: response,
            message: 'Cart validation completed'
        });
    } catch (error) {
        logger.error('Error validating cart', {
            userId: req.user?.userId,
            error: error.message,
            stack: error.stack,
            correlationId: req.correlationId
        });

        res.status(500).json(errorResponse('Failed to validate cart', error.message));
    }
};

/**
 * Convert cart to order items
 * POST /api/cart/convert-to-order
 */
const convertToOrderItems = async (req, res) => {
    try {
        const userId = req.user._id;

        logger.info('Converting cart to order items', {
            userId,
            correlationId: req.correlationId
        });

        // Find user's cart
        const cart = await Cart.findByUserId(userId);
        if (!cart) {
            return res.status(404).json(errorResponse('Cart not found'));
        }

        if (cart.items.length === 0) {
            return res.status(400).json(errorResponse('Cart is empty'));
        }

        // Validate cart before conversion
        const validation = await cart.validateCart();
        if (!validation.isValid) {
            return res.status(400).json(errorResponse('Cart contains invalid items', {
                errors: validation.errors
            }));
        }

        // Convert to order items
        const orderItems = cart.convertToOrderItems();

        logger.info('Cart converted to order items successfully', {
            userId,
            itemCount: orderItems.length,
            totalAmount: cart.totalAmount,
            correlationId: req.correlationId
        });

        const response = {
            orderItems,
            totalAmount: cart.totalAmount,
            totalItems: cart.totalItems,
            cartId: cart._id
        };

        res.status(200).json({
            success: true,
            data: response,
            message: 'Cart converted to order items successfully'
        });
    } catch (error) {
        logger.error('Error converting cart to order items', {
            userId: req.user?.userId,
            error: error.message,
            stack: error.stack,
            correlationId: req.correlationId
        });

        res.status(500).json(errorResponse('Failed to convert cart to order items', error.message));
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart,
    validateCart,
    convertToOrderItems
};