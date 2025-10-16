const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const User = require('../models/User');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        console.log('Order Controller - Received request body:', JSON.stringify(req.body, null, 2));

        const {
            items,
            totalAmount,
            couponInfo,
            shippingDetails
        } = req.body;

        console.log('Order Controller - Extracted items:', items);
        console.log('Order Controller - Total amount:', totalAmount);
        console.log('Order Controller - Coupon info:', couponInfo);

        // Validate products and calculate total
        let calculatedTotal = 0;
        const validatedItems = [];
        const allVariantsByProduct = {}; // Store variants by product for later use

        for (const item of items) {
            console.log('Order Controller - Processing item:', JSON.stringify(item, null, 2));
            console.log('Order Controller - Looking for product with ID:', item.productId);

            if (!item.productId) {
                console.error('Order Controller - productId is undefined for item:', item);
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Product ID is missing for one or more items',
                        code: 'MISSING_PRODUCT_ID'
                    }
                });
            }

            const product = await Product.findById(item.productId);
            console.log('Order Controller - Product found:', product ? product.name : 'NOT FOUND');

            if (!product || !product.is_active) {
                console.error('Order Controller - Product not found or inactive:', item.productId);
                return res.status(400).json({
                    success: false,
                    error: {
                        message: `Product ${item.productName || item.productId} is not available`,
                        code: 'PRODUCT_NOT_AVAILABLE'
                    }
                });
            }

            // Get all variants for this product (store for later use)
            if (!allVariantsByProduct[item.productId]) {
                allVariantsByProduct[item.productId] = await ProductVariant.find({ product_id: item.productId });
                console.log('Order Controller - All variants for product:', allVariantsByProduct[item.productId].map(v => ({
                    id: v._id,
                    size: v.size,
                    is_available: v.is_available,
                    price: v.price
                })));
            }

            // Find the specific variant
            const variant = await ProductVariant.findOne({
                product_id: item.productId,
                size: item.variantSize,
                is_available: true
            });

            console.log('Order Controller - Looking for variant:', {
                product_id: item.productId,
                size: item.variantSize,
                is_available: true
            });

            console.log('Order Controller - Variant found:', variant ? 'YES' : 'NO');

            if (!variant) {
                console.error('Order Controller - Variant not found or not available');
                return res.status(400).json({
                    success: false,
                    error: {
                        message: `Variant ${item.variantSize} for ${item.productName} is not available`,
                        code: 'VARIANT_NOT_AVAILABLE'
                    }
                });
            }

            // Check stock availability
            if (variant.stock_quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: `Insufficient stock for ${item.productName} - ${item.variantSize}`,
                        code: 'INSUFFICIENT_STOCK'
                    }
                });
            }

            // Verify price matches
            if (item.price !== variant.price) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: `Price mismatch for ${item.productName}`,
                        code: 'PRICE_MISMATCH'
                    }
                });
            }

            calculatedTotal += item.price * item.quantity;
            validatedItems.push({
                ...item,
                productName: product.name,
                variantId: variant._id
            });
        }

        // Verify total amount (accounting for coupons)
        let expectedTotal = calculatedTotal;
        let discountAmount = 0;

        if (couponInfo && couponInfo.discountAmount) {
            // If coupon is applied, validate the discount
            discountAmount = couponInfo.discountAmount;
            expectedTotal = calculatedTotal - discountAmount;

            console.log('Order Controller - Coupon validation:', {
                originalTotal: calculatedTotal,
                discountAmount: discountAmount,
                expectedTotal: expectedTotal,
                receivedTotal: totalAmount
            });

            // Verify the discount amount is reasonable (not more than original total)
            if (discountAmount > calculatedTotal) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Invalid discount amount',
                        code: 'INVALID_DISCOUNT'
                    }
                });
            }
        }

        if (Math.abs(expectedTotal - totalAmount) > 0.01) {
            console.error('Order Controller - Total mismatch:', {
                calculatedTotal,
                discountAmount,
                expectedTotal,
                receivedTotal: totalAmount,
                difference: Math.abs(expectedTotal - totalAmount)
            });

            return res.status(400).json({
                success: false,
                error: {
                    message: 'Total amount mismatch',
                    code: 'TOTAL_MISMATCH'
                }
            });
        }

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Prepare shipping details (flatten from nested object)
        const shippingData = {
            shipping_name: shippingDetails.full_name,
            shipping_email: req.user.email, // Use user's email from auth
            shipping_phone: shippingDetails.phone,
            shipping_address: `${shippingDetails.address_line_1}${shippingDetails.address_line_2 ? ', ' + shippingDetails.address_line_2 : ''}`,
            shipping_city: shippingDetails.city,
            shipping_state: shippingDetails.state,
            shipping_pincode: shippingDetails.postal_code,
            shipping_country: shippingDetails.country || 'India'
        };

        console.log('Order Controller - Prepared shipping data:', shippingData);

        // Prepare items with all required fields
        const orderItems = validatedItems.map(item => {
            const variants = allVariantsByProduct[item.productId];
            const variant = variants.find(v => v.size === item.variantSize);
            return {
                product_id: item.productId,
                variant_id: variant ? variant._id : item.variantId,
                product_name: item.productName,
                variant_size: item.variantSize,
                price: item.price,
                quantity: item.quantity,
                achievement_title: item.achievement_title || '',
                trader_name: item.trader_name || ''
            };
        });

        console.log('Order Controller - Prepared order items:', JSON.stringify(orderItems, null, 2));

        // Create order
        const orderData = {
            order_number: orderNumber,
            user_id: req.user._id,
            items: orderItems,
            total_amount: totalAmount,
            subtotal: calculatedTotal,
            status: 'new',
            payment_status: 'pending',
            ...shippingData
        };

        // Add coupon information if applied
        if (couponInfo) {
            orderData.coupon_code = couponInfo.couponCode;
            orderData.coupon_discount = couponInfo.discountAmount;
        }

        console.log('Order Controller - Creating order with data:', JSON.stringify(orderData, null, 2));

        const order = await Order.create(orderData);

        // Populate user and product details
        await order.populate([
            { path: 'user_id', select: 'email full_name' },
            { path: 'items.product_id', select: 'name slug' }
        ]);

        res.status(201).json({
            success: true,
            data: {
                order: {
                    id: order._id,
                    order_number: order.order_number,
                    status: order.status,
                    total_amount: order.total_amount,
                    payment_status: order.payment_status,
                    created_at: order.created_at
                }
            },
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('Error creating order:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));

            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create order',
                code: 'CREATE_ORDER_ERROR'
            }
        });
    }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        // Build query
        let query = { user_id: req.user._id };
        if (status && status !== 'all') {
            query.status = status;
        }

        const orders = await Order.find(query)
            .select('-__v')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .populate('items.product_id', 'name slug');

        const total = await Order.countDocuments(query);
        const pages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: {
                orders: orders,
                total: total,
                page: page,
                totalPages: pages
            }
        });

    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch orders',
                code: 'FETCH_ORDERS_ERROR'
            }
        });
    }
};

// @desc    Get specific order details
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findOne({
            _id: id,
            user_id: req.user._id
        })
            .select('-__v')
            .populate('items.product_id', 'name slug images')
            .populate('user_id', 'email full_name');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch order',
                code: 'FETCH_ORDER_ERROR'
            }
        });
    }
};

// @desc    Get order tracking details
// @route   GET /api/orders/:id/track
// @access  Private
const getOrderTracking = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findOne({
            _id: id,
            user_id: req.user._id
        }).select('order_number status tracking created_at');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                order_number: order.order_number,
                status: order.status,
                tracking: order.tracking,
                created_at: order.created_at
            }
        });

    } catch (error) {
        console.error('Error fetching order tracking:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch tracking info',
                code: 'FETCH_TRACKING_ERROR'
            }
        });
    }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findOne({
            _id: id,
            user_id: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        // Check if order can be cancelled
        if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Order cannot be cancelled at this stage',
                    code: 'CANNOT_CANCEL_ORDER'
                }
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.status(200).json({
            success: true,
            data: {
                order: {
                    id: order._id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    updatedAt: order.updatedAt
                }
            },
            message: 'Order cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to cancel order',
                code: 'CANCEL_ORDER_ERROR'
            }
        });
    }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/admin/orders
// @access  Private (Admin)
const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || 'all';

        // Build query
        let query = {};

        if (search) {
            // Search in order number, customer name, or email
            const users = await User.find({
                $or: [
                    { full_name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            const userIds = users.map(user => user._id);

            query.$or = [
                { order_number: { $regex: search, $options: 'i' } },
                { user_id: { $in: userIds } }
            ];
        }

        if (status !== 'all') {
            query.status = status;
        }

        const orders = await Order.find(query)
            .select('-__v')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user_id', 'email full_name phone')
            .populate('items.product_id', 'name');

        const total = await Order.countDocuments(query);
        const pages = Math.ceil(total / limit);

        // Transform data to match frontend Order interface
        const transformedOrders = orders.map(order => ({
            id: order._id,
            user_id: order.user_id?._id || order.user_id,
            order_number: order.order_number,
            status: order.status,
            payment_status: order.payment_status,
            subtotal: order.subtotal || 0,
            shipping_amount: order.shipping_amount || 0,
            tax_amount: order.tax_amount || 0,
            total_amount: order.total_amount,
            shipping_name: order.shipping_name,
            shipping_email: order.shipping_email || order.user_id?.email || '',
            shipping_phone: order.shipping_phone,
            shipping_address: order.shipping_address,
            shipping_city: order.shipping_city,
            shipping_state: order.shipping_state,
            shipping_pincode: order.shipping_pincode,
            shipping_country: order.shipping_country,
            items: order.items,
            tracking_number: order.tracking_number,
            shipment_id: order.shipment_id,
            payment_id: order.payment_id,
            razorpay_order_id: order.razorpay_order_id,
            notes: order.notes,
            created_at: order.created_at,
            updated_at: order.updated_at,
            shipped_at: order.shipped_at,
            delivered_at: order.delivered_at
        }));

        res.status(200).json({
            success: true,
            orders: transformedOrders,
            total,
            page,
            pages,
            limit
        });

    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch orders',
                code: 'FETCH_ORDERS_ERROR'
            }
        });
    }
};

// @desc    Get order by ID (Admin only)
// @route   GET /api/orders/admin/:id
// @access  Private (Admin)
const getOrderByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .select('-__v')
            .populate('items.product_id', 'name slug images')
            .populate('user_id', 'email full_name phone');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        // Transform data to match frontend Order interface
        const transformedOrder = {
            id: order._id,
            user_id: order.user_id?._id || order.user_id,
            order_number: order.order_number,
            status: order.status,
            payment_status: order.payment_status,
            subtotal: order.subtotal || 0,
            shipping_amount: order.shipping_amount || 0,
            tax_amount: order.tax_amount || 0,
            total_amount: order.total_amount,
            shipping_name: order.shipping_name,
            shipping_email: order.shipping_email || order.user_id?.email || '',
            shipping_phone: order.shipping_phone,
            shipping_address: order.shipping_address,
            shipping_city: order.shipping_city,
            shipping_state: order.shipping_state,
            shipping_pincode: order.shipping_pincode,
            shipping_country: order.shipping_country,
            items: order.items,
            tracking_number: order.tracking_number,
            shipment_id: order.shipment_id,
            payment_id: order.payment_id,
            razorpay_order_id: order.razorpay_order_id,
            notes: order.notes,
            created_at: order.created_at,
            updated_at: order.updated_at,
            shipped_at: order.shipped_at,
            delivered_at: order.delivered_at,
            // Include user details for admin view
            user: order.user_id ? {
                email: order.user_id.email,
                full_name: order.user_id.full_name,
                phone: order.user_id.phone
            } : null
        };

        res.status(200).json({
            success: true,
            data: transformedOrder
        });

    } catch (error) {
        console.error('Error fetching order by ID (admin):', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch order',
                code: 'FETCH_ORDER_ERROR'
            }
        });
    }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, tracking } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        // Validate status transition
        const validStatuses = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid status',
                    code: 'INVALID_STATUS'
                }
            });
        }

        // Update order
        order.status = status;

        // Update tracking info if provided
        if (tracking) {
            order.tracking = { ...order.tracking, ...tracking };
        }

        await order.save();

        // Populate for response
        await order.populate('userId', 'email full_name');

        res.status(200).json({
            success: true,
            data: {
                order: {
                    id: order._id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    tracking: order.tracking,
                    updatedAt: order.updatedAt
                }
            },
            message: 'Order status updated successfully'
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update order status',
                code: 'UPDATE_ORDER_ERROR'
            }
        });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    getOrderByIdAdmin,
    getOrderTracking,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
};