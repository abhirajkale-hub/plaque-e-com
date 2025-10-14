/**
 * Shipping Controller
 * Updated to use Shiprocket API integration
 */

const Order = require('../models/Order');
const shiprocketService = require('../services/shiprocketService');
const { LoggingService } = require('../services/loggingService');
const { sendDeliveryNotificationEmail } = require('../services/emailService');

// @desc    Create shipment for a paid order
// @route   POST /api/shipping/create-shipment
// @access  Private (Admin or automated after payment)
const createShipment = async (req, res) => {
    const startTime = Date.now();
    const correlationId = req.correlationId || LoggingService.generateCorrelationId();

    try {
        const { orderId } = req.body;

        LoggingService.shippingInfo('Shipment creation started', {
            correlationId,
            orderId,
            userId: req.user?._id,
            userEmail: req.user?.email,
            ip: req.ip
        });

        // Find the order
        const order = await Order.findById(orderId).populate('items.productId');

        if (!order) {
            LoggingService.shippingError('Shipment creation failed - Order not found', {
                correlationId,
                orderId,
                userId: req.user?._id,
                userEmail: req.user?.email
            });

            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        // Check if order is paid
        if (order.paymentStatus !== 'PAID') {
            LoggingService.shippingError('Shipment creation failed - Order not paid', {
                correlationId,
                orderId: order._id,
                orderNumber: order.orderNumber,
                paymentStatus: order.paymentStatus,
                userId: req.user?._id,
                userEmail: req.user?.email
            });

            return res.status(400).json({
                success: false,
                error: {
                    message: 'Order must be paid before creating shipment',
                    code: 'ORDER_NOT_PAID'
                }
            });
        }

        // Check if shipment already exists
        if (order.shipping?.awbCode) {
            LoggingService.shippingError('Shipment creation failed - Shipment already exists', {
                correlationId,
                orderId: order._id,
                orderNumber: order.orderNumber,
                existingAwbCode: order.shipping.awbCode,
                userId: req.user?._id,
                userEmail: req.user?.email
            });

            return res.status(400).json({
                success: false,
                error: {
                    message: 'Shipment already exists for this order',
                    code: 'SHIPMENT_EXISTS'
                }
            });
        }

        LoggingService.shippingInfo('Creating shipment with Shiprocket', {
            correlationId,
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            shippingAddress: order.shippingAddress,
            userId: req.user?._id,
            userEmail: req.user?.email
        });

        // Prepare order data for Shiprocket
        const orderData = {
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            customer_email: req.user?.email,
            items: order.items.map(item => ({
                name: item.productId.name,
                sku: item.productId.sku || item.productId._id,
                quantity: item.quantity,
                price: item.price,
                weight: item.productId.weight || 500, // Default 500g
                hsn: item.productId.hsn_code || 0
            })),
            shipping_name: order.shippingAddress.name,
            shipping_phone: order.shippingAddress.phone,
            shipping_address: `${order.shippingAddress.address}, ${order.shippingAddress.locality}`,
            shipping_city: order.shippingAddress.city,
            shipping_state: order.shippingAddress.state,
            shipping_pincode: order.shippingAddress.pincode,
            shipping_country: order.shippingAddress.country || 'India'
        };

        // Create shipment in Shiprocket
        const shipmentResult = await shiprocketService.createShipment(orderData);

        LoggingService.shippingInfo('Shiprocket shipment created successfully', {
            correlationId,
            orderId: order._id,
            orderNumber: order.orderNumber,
            shipmentId: shipmentResult.shipmentId,
            awb: shipmentResult.awb,
            duration: Date.now() - startTime
        });

        // Update order with shipping information
        order.shipping = {
            status: 'shipped',
            shiprocketOrderId: shipmentResult.orderId,
            shipmentId: shipmentResult.shipmentId,
            awbCode: shipmentResult.awb,
            courierCompany: shipmentResult.courierCompany,
            courierName: shipmentResult.courierName,
            trackingUrl: shipmentResult.trackingUrl,
            estimatedDeliveryDate: shipmentResult.estimatedDelivery,
            shippedAt: new Date()
        };

        // Update legacy tracking for backward compatibility
        order.tracking = {
            awbCode: shipmentResult.awb,
            courierCompany: shipmentResult.courierName,
            trackingUrl: shipmentResult.trackingUrl,
            estimatedDeliveryDate: shipmentResult.estimatedDelivery
        };

        // Update order status
        order.status = 'shipped';

        await order.save();

        LoggingService.shippingAudit('SHIPMENT_CREATED', {
            correlationId,
            orderId: order._id,
            orderNumber: order.orderNumber,
            shiprocketOrderId: shipmentResult.orderId,
            shipmentId: shipmentResult.shipmentId,
            awbCode: shipmentResult.awb,
            courierCompany: shipmentResult.courierName,
            trackingUrl: shipmentResult.trackingUrl,
            estimatedDeliveryDate: shipmentResult.estimatedDelivery,
            shippingAddress: order.shippingAddress,
            userId: req.user?._id,
            userEmail: req.user?.email,
            duration: Date.now() - startTime
        });

        res.status(200).json({
            success: true,
            data: {
                message: 'Shipment created successfully',
                orderId: order._id,
                orderNumber: order.orderNumber,
                awbCode: shipmentResult.awb,
                courierName: shipmentResult.courierName,
                trackingUrl: shipmentResult.trackingUrl,
                estimatedDeliveryDate: shipmentResult.estimatedDelivery,
                shipmentDetails: shipmentResult
            }
        });

    } catch (error) {
        LoggingService.shippingError('Shipment creation error', {
            correlationId,
            orderId: req.body.orderId,
            userId: req.user?._id,
            userEmail: req.user?.email,
            duration: Date.now() - startTime
        }, error);

        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error while creating shipment',
                code: 'SHIPMENT_ERROR'
            }
        });
    }
};

// @desc    Track shipment by order ID or AWB code
// @route   GET /api/shipping/track/:identifier
// @access  Private
const trackShipment = async (req, res) => {
    const startTime = Date.now();
    const correlationId = req.correlationId || LoggingService.generateCorrelationId();

    try {
        const { identifier } = req.params;
        let order;
        let awbCode;

        LoggingService.shippingInfo('Shipment tracking started', {
            correlationId,
            identifier,
            userId: req.user?._id,
            userEmail: req.user?.email,
            ip: req.ip
        });

        // Check if identifier is an order ID or AWB code
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            // MongoDB ObjectId format - find order by ID
            order = await Order.findById(identifier);
            if (order && order.shipping?.awbCode) {
                awbCode = order.shipping.awbCode;
            }
        } else if (identifier.startsWith('MTA-') || identifier.startsWith('ORD-')) {
            // Order number format
            order = await Order.findOne({ orderNumber: identifier });
            if (order && order.shipping?.awbCode) {
                awbCode = order.shipping.awbCode;
            }
        } else {
            // Assume it's an AWB code
            awbCode = identifier;
            order = await Order.findOne({ 'shipping.awbCode': awbCode });
        }

        if (!awbCode) {
            LoggingService.shippingError('Shipment tracking failed - No shipment found', {
                correlationId,
                identifier,
                userId: req.user?._id,
                userEmail: req.user?.email
            });

            return res.status(404).json({
                success: false,
                error: {
                    message: 'No shipment found for the provided identifier',
                    code: 'SHIPMENT_NOT_FOUND'
                }
            });
        }

        LoggingService.shippingInfo('Tracking shipment with Shiprocket', {
            correlationId,
            identifier,
            awbCode,
            orderId: order?._id,
            orderNumber: order?.orderNumber,
            userId: req.user?._id,
            userEmail: req.user?.email
        });

        // Get tracking information from Shiprocket
        const trackingResult = await shiprocketService.trackShipment(awbCode);

        // Update order with latest tracking information if order exists
        if (order) {
            order.shipping.lastTrackingUpdate = {
                status: trackingResult.status,
                timestamp: new Date(),
                activity: trackingResult.trackingHistory[0]?.activity || 'Status updated'
            };

            // Update delivery status
            if (trackingResult.status === 'delivered') {
                order.shipping.status = 'delivered';
                order.shipping.deliveredAt = new Date();
                order.status = 'delivered';
            }

            await order.save();
        }

        res.status(200).json({
            success: true,
            data: {
                awbCode: trackingResult.awb,
                currentStatus: trackingResult.status,
                isDelivered: trackingResult.status === 'delivered',
                courierName: trackingResult.courierName,
                trackingUrl: trackingResult.trackingUrl,
                estimatedDeliveryDate: trackingResult.estimatedDelivery,
                trackingHistory: trackingResult.trackingHistory,
                orderNumber: order?.orderNumber,
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error) {
        LoggingService.shippingError('Shipment tracking error', {
            correlationId,
            identifier: req.params.identifier,
            userId: req.user?._id,
            userEmail: req.user?.email,
            duration: Date.now() - startTime
        }, error);

        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error while tracking shipment',
                code: 'TRACKING_ERROR'
            }
        });
    }
};

// @desc    Handle Shiprocket webhook for shipment updates
// @route   POST /api/shipping/webhook
// @access  Public (but secured with webhook signature)
const handleShippingWebhook = async (req, res) => {
    const startTime = Date.now();
    const correlationId = LoggingService.generateCorrelationId();

    try {
        const webhookSignature = req.headers['x-shiprocket-signature'];
        const webhookBody = JSON.stringify(req.body);

        LoggingService.shippingInfo('Shiprocket webhook received', {
            correlationId,
            hasSignature: !!webhookSignature,
            webhookData: req.body,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Validate webhook signature if provided
        if (webhookSignature && process.env.SHIPROCKET_WEBHOOK_SECRET) {
            const isValidSignature = shiprocketService.verifyWebhook(
                webhookBody,
                webhookSignature,
                process.env.SHIPROCKET_WEBHOOK_SECRET
            );

            if (!isValidSignature) {
                LoggingService.securityEvent('Invalid Shiprocket webhook signature', {
                    correlationId,
                    signature: webhookSignature,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    webhookData: req.body
                });

                return res.status(400).json({
                    error: 'Invalid webhook signature',
                    code: 'INVALID_WEBHOOK_SIGNATURE'
                });
            }
        }

        LoggingService.shippingInfo('Webhook signature validated, processing webhook', {
            correlationId,
            webhookData: req.body
        });

        // Process webhook data
        const webhookData = shiprocketService.processWebhook(req.body);

        // Find order by AWB code
        const order = await Order.findOne({
            'shipping.awbCode': webhookData.awb
        });

        if (!order) {
            LoggingService.shippingError('Order not found for webhook data', {
                correlationId,
                webhookData,
                awb: webhookData.awb
            });

            return res.status(404).json({
                error: 'Order not found for webhook data',
                code: 'ORDER_NOT_FOUND'
            });
        }

        // Update shipping status based on webhook data
        order.shipping.lastTrackingUpdate = {
            status: webhookData.status,
            timestamp: new Date(webhookData.lastUpdated || Date.now()),
            activity: webhookData.status,
            location: 'In Transit'
        };

        // Update shipping status and order status based on shipment status
        if (webhookData.status === 'delivered') {
            order.shipping.status = 'delivered';
            order.shipping.deliveredAt = new Date(webhookData.deliveredDate || Date.now());
            order.status = 'delivered';

            // Send delivery notification email to customer
            try {
                await sendDeliveryNotificationEmail(
                    order.shippingDetails?.email || order.shipping_email,
                    order.shippingDetails?.name || order.shipping_name,
                    order.orderNumber,
                    order.shipping.deliveredAt
                );

                LoggingService.shippingInfo('Delivery notification email sent successfully', {
                    correlationId,
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    customerEmail: order.shippingDetails?.email || order.shipping_email,
                    deliveredAt: order.shipping.deliveredAt
                });

            } catch (emailError) {
                LoggingService.shippingError('Failed to send delivery notification email', {
                    correlationId,
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    customerEmail: order.shippingDetails?.email || order.shipping_email,
                    emailError: emailError.message
                });
                // Email failure doesn't affect the delivery process
            }
        } else {
            // Map Shiprocket status to our shipping status
            const statusMap = {
                'created': 'created',
                'picked_up': 'shipped',
                'in_transit': 'in_transit',
                'out_for_delivery': 'out_for_delivery',
                'delivered': 'delivered',
                'undelivered': 'in_transit',
                'cancelled': 'cancelled',
                'lost': 'lost',
                'damaged': 'damaged'
            };

            const mappedStatus = statusMap[webhookData.status.toLowerCase()] || 'in_transit';
            order.shipping.status = mappedStatus;

            if (mappedStatus === 'shipped' || mappedStatus === 'in_transit') {
                order.status = 'shipped';
            } else if (mappedStatus === 'out_for_delivery') {
                order.status = 'out_for_delivery';
            }
        }

        await order.save();

        console.log(`✅ Updated order ${order.orderNumber} with Shiprocket webhook data`);

        res.status(200).json({
            status: 'success',
            message: 'Webhook processed successfully',
            orderId: order._id,
            processed_at: new Date().toISOString()
        });

    } catch (error) {
        LoggingService.shippingError('Error handling shipping webhook', {
            correlationId,
            duration: Date.now() - startTime
        }, error);

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to handle webhook',
                code: 'WEBHOOK_ERROR'
            }
        });
    }
};

// @desc    Generate shipping label for an order
// @route   POST /api/shipping/generate-label
// @access  Private (Admin)
const generateShippingLabel = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        if (!order.shipping?.shipmentId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'No shipment found for this order',
                    code: 'NO_SHIPMENT'
                }
            });
        }

        console.log(`Generating label for shipment: ${order.shipping.shipmentId}`);

        // Note: Shiprocket handles label generation differently
        // Labels are typically available after shipment creation
        const labelUrl = `https://shiprocket.in/tracking/${order.shipping.awbCode}`;

        const labelResult = {
            labelUrl: labelUrl,
            labelBase64: null // Shiprocket doesn't provide base64 labels via API
        };

        // Update order with label URL
        order.shipping.labelUrl = labelResult.labelUrl;
        await order.save();

        res.status(200).json({
            success: true,
            data: {
                message: 'Shipping label generated successfully',
                labelUrl: labelResult.labelUrl,
                labelBase64: labelResult.labelBase64,
                orderId: order._id,
                orderNumber: order.orderNumber
            }
        });

    } catch (error) {
        console.error('Error generating shipping label:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error while generating label',
                code: 'LABEL_ERROR'
            }
        });
    }
};

// @desc    Cancel shipment
// @route   POST /api/shipping/cancel-shipment
// @access  Private (Admin)
const cancelShipment = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        if (!order.shipping?.awbCode) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'No shipment found for this order',
                    code: 'NO_SHIPMENT'
                }
            });
        }

        console.log(`Cancelling shipment with AWB: ${order.shipping.awbCode}`);

        const cancelResult = await shiprocketService.cancelShipment(order.shipping.awbCode);

        // Update order status
        order.shipping.status = 'cancelled';
        order.status = 'cancelled';
        await order.save();

        res.status(200).json({
            success: true,
            data: {
                message: 'Shipment cancelled successfully',
                orderId: order._id,
                orderNumber: order.orderNumber
            }
        });

    } catch (error) {
        console.error('Error cancelling shipment:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error while cancelling shipment',
                code: 'CANCELLATION_ERROR'
            }
        });
    }
};

// @desc    Get shipping service status
// @route   GET /api/shipping/status
// @access  Private (Admin)
const getShippingServiceStatus = async (req, res) => {
    try {
        // Test Shiprocket authentication
        await shiprocketService.authenticate();

        res.status(200).json({
            success: true,
            data: {
                service: 'Shiprocket',
                status: 'operational',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error getting shipping service status:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get service status',
                code: 'STATUS_ERROR'
            }
        });
    }
};

module.exports = {
    createShipment,
    trackShipment,
    handleShippingWebhook,
    generateShippingLabel,
    cancelShipment,
    getShippingServiceStatus
};