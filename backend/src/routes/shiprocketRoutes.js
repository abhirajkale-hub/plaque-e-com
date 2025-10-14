const express = require('express');
const router = express.Router();
const shiprocketService = require('../services/shiprocketService');
const Order = require('../models/Order');
const { authenticate } = require('../middleware/auth');
const { LoggingService } = require('../services/loggingService');

// Helper function to generate correlation ID
const generateCorrelationId = () => LoggingService.generateCorrelationId();

/**
 * @route   GET /api/shiprocket/test-auth
 * @desc    Test Shiprocket authentication and get pickup locations
 * @access  Private
 */
router.get('/test-auth', authenticate, async (req, res) => {
    try {
        const correlationId = generateCorrelationId();
        const startTime = Date.now();

        console.log('Testing Shiprocket authentication...');

        // Test authentication
        const token = await shiprocketService.authenticate();

        // Get pickup locations
        const pickupLocations = await shiprocketService.getPickupLocations();

        LoggingService.shippingInfo('Shiprocket test successful', {
            correlationId,
            hasToken: !!token,
            pickupLocationsCount: pickupLocations?.length || 0,
            duration: Date.now() - startTime
        });

        res.json({
            success: true,
            message: 'Shiprocket authentication successful',
            hasToken: !!token,
            pickupLocations: pickupLocations || [],
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        LoggingService.shippingError('Shiprocket test failed', {
            correlationId: generateCorrelationId(),
            error: error.message
        });

        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                code: 'SHIPROCKET_TEST_FAILED'
            }
        });
    }
});

/**
 * @route   POST /api/shiprocket/create-shipment
 * @desc    Create a new shipment using Shiprocket API
 * @access  Private
 * @body    { orderId: string } or full order data
 */
router.post('/create-shipment', authenticate, async (req, res) => {
    const startTime = Date.now();
    const correlationId = LoggingService.generateCorrelationId();

    try {
        const { orderId, orderData } = req.body;

        LoggingService.shippingInfo('Shiprocket shipment creation initiated', {
            correlationId,
            orderId,
            hasOrderData: !!orderData,
            userId: req.user._id,
            userEmail: req.user.email
        });

        let order;

        // If orderId is provided, fetch order from database
        if (orderId) {
            order = await Order.findOne({
                _id: orderId,
                user_id: req.user._id
            }).populate('items.product_id');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'Order not found',
                        code: 'ORDER_NOT_FOUND'
                    }
                });
            }

            // Convert order to shipment format
            order = {
                orderNumber: order.order_number,
                totalAmount: order.total_amount,
                customer_email: req.user.email,
                items: order.items.map(item => ({
                    name: item.product_id.name,
                    sku: item.product_id.sku || item.product_id._id,
                    quantity: item.quantity,
                    price: item.price,
                    weight: item.product_id.weight || 500, // Default 500g
                    hsn: item.product_id.hsn_code || 0
                })),
                shipping_name: order.shipping_name,
                shipping_phone: order.shipping_phone,
                shipping_address: order.shipping_address,
                shipping_city: order.shipping_city,
                shipping_state: order.shipping_state,
                shipping_pincode: order.shipping_pincode,
                shipping_country: order.shipping_country || 'India'
            };
        } else if (orderData) {
            order = orderData;
        } else {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Either orderId or orderData is required',
                    code: 'MISSING_ORDER_DATA'
                }
            });
        }

        // Create shipment with Shiprocket
        const shipmentResult = await shiprocketService.createShipment(order);

        // Update order with shipment details if orderId was provided
        if (orderId) {
            await Order.findByIdAndUpdate(orderId, {
                $set: {
                    'tracking.awb_number': shipmentResult.awb,
                    'tracking.shipment_id': shipmentResult.shipmentId,
                    'tracking.courier_company': shipmentResult.courierCompany,
                    'tracking.courier_name': shipmentResult.courierName,
                    'tracking.tracking_url': shipmentResult.trackingUrl,
                    'tracking.estimated_delivery': shipmentResult.estimatedDelivery,
                    'shipping_status': 'processing',
                    'tracking.last_updated': new Date()
                }
            });
        }

        LoggingService.shippingInfo('Shiprocket shipment created successfully', {
            correlationId,
            orderId,
            shipmentId: shipmentResult.shipmentId,
            awb: shipmentResult.awb,
            duration: Date.now() - startTime
        });

        res.status(201).json({
            success: true,
            data: {
                shipmentId: shipmentResult.shipmentId,
                awb: shipmentResult.awb,
                courierCompany: shipmentResult.courierCompany,
                courierName: shipmentResult.courierName,
                trackingUrl: shipmentResult.trackingUrl,
                estimatedDelivery: shipmentResult.estimatedDelivery,
                status: shipmentResult.status
            },
            message: 'Shipment created successfully'
        });

    } catch (error) {
        LoggingService.shippingError('Shiprocket shipment creation failed', {
            correlationId,
            orderId: req.body.orderId,
            error: error.message,
            stack: error.stack,
            duration: Date.now() - startTime
        });

        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                code: 'SHIPMENT_CREATION_FAILED'
            }
        });
    }
});

/**
 * @route   GET /api/shiprocket/track/:awb
 * @desc    Track shipment using AWB number
 * @access  Public (for customer tracking)
 */
router.get('/track/:awb', async (req, res) => {
    const startTime = Date.now();
    const correlationId = LoggingService.generateCorrelationId();

    try {
        const { awb } = req.params;

        LoggingService.shippingInfo('Shiprocket tracking request initiated', {
            correlationId,
            awb
        });

        const trackingInfo = await shiprocketService.trackShipment(awb);

        LoggingService.shippingInfo('Shiprocket tracking successful', {
            correlationId,
            awb,
            status: trackingInfo.status,
            duration: Date.now() - startTime
        });

        res.json({
            success: true,
            data: trackingInfo
        });

    } catch (error) {
        LoggingService.shippingError('Shiprocket tracking failed', {
            correlationId,
            awb: req.params.awb,
            error: error.message,
            duration: Date.now() - startTime
        });

        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                code: 'TRACKING_FAILED'
            }
        });
    }
});

/**
 * @route   GET /api/shiprocket/order/:orderId/shipments
 * @desc    Get all shipments for an order
 * @access  Private
 */
router.get('/order/:orderId/shipments', authenticate, async (req, res) => {
    try {
        const { orderId } = req.params;

        // Verify order belongs to user
        const order = await Order.findOne({
            _id: orderId,
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

        const shipments = await shiprocketService.getOrderShipments(order.order_number);

        res.json({
            success: true,
            data: shipments
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                code: 'GET_SHIPMENTS_FAILED'
            }
        });
    }
});

/**
 * @route   POST /api/shiprocket/cancel-shipment
 * @desc    Cancel a shipment
 * @access  Private
 */
router.post('/cancel-shipment', authenticate, async (req, res) => {
    try {
        const { awb, orderId } = req.body;

        if (!awb) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'AWB number is required',
                    code: 'AWB_REQUIRED'
                }
            });
        }

        // Verify order belongs to user if orderId is provided
        if (orderId) {
            const order = await Order.findOne({
                _id: orderId,
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
        }

        const result = await shiprocketService.cancelShipment(awb);

        res.json({
            success: true,
            data: result,
            message: 'Shipment cancelled successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                code: 'CANCELLATION_FAILED'
            }
        });
    }
});

/**
 * @route   GET /api/shiprocket/rates
 * @desc    Get shipping rates
 * @access  Public
 */
router.get('/rates', async (req, res) => {
    try {
        const { pickup_pincode, delivery_pincode, weight, cod } = req.query;

        if (!pickup_pincode || !delivery_pincode || !weight) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'pickup_pincode, delivery_pincode, and weight are required',
                    code: 'MISSING_PARAMETERS'
                }
            });
        }

        const rates = await shiprocketService.getShippingRates({
            pickup_pincode,
            delivery_pincode,
            weight: parseFloat(weight),
            cod: cod ? parseFloat(cod) : 0
        });

        res.json({
            success: true,
            data: rates
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                code: 'RATES_FETCH_FAILED'
            }
        });
    }
});

/**
 * @route   POST /api/shiprocket/webhook
 * @desc    Handle Shiprocket webhooks for shipment status updates
 * @access  Public (webhook endpoint)
 */
router.post('/webhook', async (req, res) => {
    const startTime = Date.now();
    const correlationId = LoggingService.generateCorrelationId();

    try {
        const signature = req.headers['x-shiprocket-signature'];
        const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;

        // Verify webhook signature if secret is provided
        if (webhookSecret && signature) {
            const isValid = shiprocketService.verifyWebhook(
                JSON.stringify(req.body),
                signature,
                webhookSecret
            );

            if (!isValid) {
                LoggingService.shippingError('Invalid Shiprocket webhook signature', {
                    correlationId,
                    signature,
                    body: JSON.stringify(req.body)
                });

                return res.status(401).json({
                    success: false,
                    error: 'Invalid signature'
                });
            }
        }

        LoggingService.shippingInfo('Shiprocket webhook received', {
            correlationId,
            body: req.body
        });

        // Process webhook data
        const webhookData = shiprocketService.processWebhook(req.body);

        // Update order status in database
        if (webhookData.awb) {
            const updateResult = await Order.updateOne(
                { 'tracking.awb_number': webhookData.awb },
                {
                    $set: {
                        'shipping_status': webhookData.status,
                        'tracking.last_updated': new Date(),
                        'tracking.current_status': webhookData.status
                    }
                }
            );

            if (webhookData.deliveredDate) {
                await Order.updateOne(
                    { 'tracking.awb_number': webhookData.awb },
                    {
                        $set: {
                            'tracking.delivered_date': new Date(webhookData.deliveredDate),
                            'order_status': 'delivered'
                        }
                    }
                );
            }

            LoggingService.shippingInfo('Order status updated from webhook', {
                correlationId,
                awb: webhookData.awb,
                status: webhookData.status,
                updateResult: updateResult.modifiedCount
            });
        }

        res.status(200).json({
            success: true,
            message: 'Webhook processed successfully'
        });

    } catch (error) {
        LoggingService.shippingError('Webhook processing failed', {
            correlationId,
            error: error.message,
            stack: error.stack,
            body: req.body,
            duration: Date.now() - startTime
        });

        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                code: 'WEBHOOK_PROCESSING_FAILED'
            }
        });
    }
});

/**
 * @route   GET /api/shiprocket/status
 * @desc    Get Shiprocket service status
 * @access  Public
 */
router.get('/status', async (req, res) => {
    try {
        // Try to authenticate to check if service is working
        await shiprocketService.authenticate();

        res.json({
            success: true,
            status: 'operational',
            service: 'Shiprocket',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unavailable',
            service: 'Shiprocket',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;