const Order = require('../models/Order');
const razorpayService = require('../services/razorpayService');
const shiprocketService = require('../services/shiprocketService');
const { LoggingService } = require('../services/loggingService');
const { sendShippingNotificationEmail } = require('../services/emailService');

// @desc    Create Razorpay order for payment
// @route   POST /api/payments/create-order
// @access  Private
const createPaymentOrder = async (req, res) => {
    const startTime = Date.now();
    const correlationId = req.correlationId || LoggingService.generateCorrelationId();

    try {
        const { orderId, amount } = req.body;

        LoggingService.paymentInfo('Payment order creation started', {
            correlationId,
            orderId,
            amount,
            user_id: req.user._id,
            userEmail: req.user.email,
            ip: req.ip
        });

        // Find the order
        const order = await Order.findOne({
            _id: orderId,
            user_id: req.user._id
        });

        if (!order) {
            LoggingService.paymentError('Payment order creation failed - Order not found', {
                correlationId,
                orderId,
                user_id: req.user._id,
                userEmail: req.user.email
            });

            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        // Verify amount matches
        if (Math.abs(order.total_amount - amount) > 0.01) {
            LoggingService.paymentError('Payment order creation failed - Amount mismatch', {
                correlationId,
                orderId,
                orderAmount: order.total_amount,
                requestedAmount: amount,
                user_id: req.user._id,
                userEmail: req.user.email,
                orderNumber: order.order_number
            });

            return res.status(400).json({
                success: false,
                error: {
                    message: 'Amount mismatch',
                    code: 'AMOUNT_MISMATCH'
                }
            });
        }

        // Check if order is already paid
        if (order.payment_status === 'completed') {
            LoggingService.paymentError('Payment order creation failed - Order already paid', {
                correlationId,
                orderId,
                orderNumber: order.order_number,
                user_id: req.user._id,
                userEmail: req.user.email,
                paymentStatus: order.payment_status
            });

            return res.status(400).json({
                success: false,
                error: {
                    message: 'Order is already paid',
                    code: 'ALREADY_PAID'
                }
            });
        }

        // Enhanced Razorpay order creation with production service
        try {
            // Prepare order data for Razorpay
            const razorpayOrderData = {
                amount: amount * 100, // Convert to paise for Razorpay
                currency: 'INR',
                receipt: order.order_number,
                notes: {
                    order_id: order._id.toString(),
                    order_number: order.order_number,
                    user_id: req.user._id.toString(),
                    customer_email: req.user.email
                }
            };

            LoggingService.paymentInfo('Creating Razorpay order', {
                correlationId,
                orderNumber: order.order_number,
                amount: razorpayOrderData.amount,
                currency: razorpayOrderData.currency,
                user_id: req.user._id,
                userEmail: req.user.email
            });

            // Create order using Razorpay service
            const razorpayOrder = await razorpayService.createOrder(razorpayOrderData);

            // Update order with Razorpay order ID
            order.razorpay_order_id = razorpayOrder.id;
            order.paymentInitiatedAt = new Date();
            await order.save();

            LoggingService.paymentAudit('PAYMENT_ORDER_CREATED', {
                correlationId,
                orderId: order._id,
                orderNumber: order.order_number,
                razorpay_order_id: razorpayOrder.id,
                amount: razorpayOrderData.amount,
                currency: razorpayOrderData.currency,
                user_id: req.user._id,
                userEmail: req.user.email,
                duration: Date.now() - startTime
            });

            // Prepare response data
            const responseData = {
                razorpay_order_id: razorpayOrder.id,
                amount: amount,
                currency: razorpayOrder.currency,
                key: process.env.RAZORPAY_KEY_ID,
                orderNumber: order.order_number,
                // Additional fields for frontend integration
                name: 'My Trade Award',
                description: `Payment for Order #${order.order_number}`,
                prefill: {
                    name: order.shipping_name,
                    email: req.user.email,
                    contact: order.shipping_phone || ''
                },
                theme: {
                    color: '#F37254'
                },
                // Razorpay order details
                razorpayOrder: {
                    id: razorpayOrder.id,
                    status: razorpayOrder.status,
                    amount: razorpayOrder.amount,
                    created_at: razorpayOrder.created_at
                }
            };

            res.status(200).json({
                success: true,
                data: responseData
            });

        } catch (error) {
            // Enhanced error handling for Razorpay errors
            LoggingService.paymentError('Razorpay order creation failed', {
                correlationId,
                orderId: order._id,
                orderNumber: order.order_number,
                user_id: req.user._id,
                userEmail: req.user.email,
                amount: amount,
                duration: Date.now() - startTime
            }, error);

            const errorResponse = razorpayService.handleRazorpayError(error);

            return res.status(errorResponse.statusCode || 500).json({
                success: false,
                error: {
                    message: errorResponse.message,
                    code: errorResponse.code
                }
            });
        }

    } catch (error) {
        LoggingService.paymentError('Payment order creation error', {
            correlationId,
            orderId: req.body.orderId,
            amount: req.body.amount,
            user_id: req.user?._id,
            userEmail: req.user?.email,
            duration: Date.now() - startTime
        }, error);

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create payment order',
                code: 'CREATE_PAYMENT_ORDER_ERROR'
            }
        });
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
    const startTime = Date.now();
    const correlationId = req.correlationId || LoggingService.generateCorrelationId();

    try {
        const {
            order_id: orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        LoggingService.paymentInfo('Payment verification started', {
            correlationId,
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            user_id: req.user._id,
            userEmail: req.user.email,
            ip: req.ip
        });

        // Find the order
        const order = await Order.findOne({
            _id: orderId,
            user_id: req.user._id
        });

        if (!order) {
            LoggingService.paymentError('Payment verification failed - Order not found', {
                correlationId,
                orderId,
                razorpay_order_id,
                user_id: req.user._id,
                userEmail: req.user.email
            });

            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        // Payment signature verification using Razorpay service
        let isValidSignature = false;
        let verificationError = null;

        try {
            // Verify payment signature using production Razorpay service
            isValidSignature = razorpayService.verifyPaymentSignature(
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            );

        } catch (error) {
            LoggingService.paymentError('Payment signature verification error', {
                correlationId,
                orderId: order._id,
                orderNumber: order.order_number,
                razorpay_order_id,
                razorpay_payment_id,
                user_id: req.user._id,
                userEmail: req.user.email
            }, error);

            verificationError = error.message;
            isValidSignature = false;
        }

        if (!isValidSignature) {
            // Log failed verification attempt for security monitoring
            LoggingService.securityEvent('Failed payment verification attempt', {
                correlationId,
                orderId: order._id,
                orderNumber: order.order_number,
                razorpay_order_id,
                razorpay_payment_id,
                user_id: req.user._id,
                userEmail: req.user.email,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                error: verificationError
            });

            return res.status(400).json({
                success: false,
                error: {
                    message: verificationError || 'Invalid payment signature',
                    code: 'INVALID_SIGNATURE'
                }
            });
        }

        LoggingService.paymentInfo('Payment signature verified successfully', {
            correlationId,
            orderId: order._id,
            orderNumber: order.order_number,
            razorpay_order_id,
            razorpay_payment_id,
            user_id: req.user._id,
            userEmail: req.user.email
        });

        // Update order payment status with additional tracking
        order.payment_status = 'completed';
        order.status = 'confirmed';
        order.paymentId = razorpay_payment_id;
        order.paymentMethod = 'razorpay';
        order.paymentCompletedAt = new Date();

        // Add payment verification metadata
        order.paymentVerificationData = {
            razorpay_order_id,
            razorpay_payment_id,
            verifiedAt: new Date(),
            method: 'razorpay_production'
        };

        await order.save();

        LoggingService.paymentAudit('PAYMENT_VERIFIED_AND_ORDER_UPDATED', {
            correlationId,
            orderId: order._id,
            orderNumber: order.order_number,
            razorpay_order_id,
            razorpay_payment_id,
            paymentAmount: order.total_amount,
            user_id: req.user._id,
            userEmail: req.user.email
        });

        // Automatic shipment creation after successful payment
        try {
            LoggingService.shippingInfo('Creating automatic shipment after payment verification', {
                correlationId,
                orderId: order._id,
                orderNumber: order.order_number,
                user_id: req.user._id,
                userEmail: req.user.email
            });

            // Prepare order data for Shiprocket
            const orderData = {
                orderNumber: order.order_number,
                totalAmount: order.total_amount,
                customer_email: req.user?.email,
                items: order.items.map(item => ({
                    name: item.productId?.name || item.product_name,
                    sku: item.productId?.sku || item.productId || item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    weight: item.productId?.weight || 500, // Default 500g
                    hsn: item.productId?.hsn_code || 0
                })),
                shipping_name: order.shippingDetails?.name || order.shipping_name,
                shipping_phone: order.shippingDetails?.phone || order.shipping_phone,
                shipping_address: order.shippingDetails?.address || `${order.shipping_address}, ${order.shipping_locality}`,
                shipping_city: order.shippingDetails?.city || order.shipping_city,
                shipping_state: order.shippingDetails?.state || order.shipping_state,
                shipping_pincode: order.shippingDetails?.pincode || order.shipping_pincode,
                shipping_country: order.shippingDetails?.country || order.shipping_country || 'India'
            };

            // Create shipment automatically with Shiprocket
            const shipmentResult = await shiprocketService.createShipment(orderData);

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

            LoggingService.shippingAudit('AUTOMATIC_SHIPMENT_CREATED', {
                correlationId,
                orderId: order._id,
                orderNumber: order.order_number,
                shiprocketOrderId: shipmentResult.orderId,
                shipmentId: shipmentResult.shipmentId,
                awbCode: shipmentResult.awb,
                courierCompany: shipmentResult.courierName,
                trackingUrl: shipmentResult.trackingUrl,
                user_id: req.user._id,
                userEmail: req.user.email
            });

            // Send shipping notification email to customer
            try {
                const trackingInfo = {
                    awbCode: shipmentResult.awb,
                    courierName: shipmentResult.courierName,
                    trackingUrl: shipmentResult.trackingUrl,
                    estimatedDeliveryDate: shipmentResult.estimatedDelivery
                };

                await sendShippingNotificationEmail(
                    order.shippingDetails?.email || order.shipping_email,
                    order.shippingDetails?.name || order.shipping_name,
                    order.order_number,
                    trackingInfo
                );

                LoggingService.shippingInfo('Shipping notification email sent successfully', {
                    correlationId,
                    orderId: order._id,
                    orderNumber: order.order_number,
                    customerEmail: order.shippingDetails?.email || order.shipping_email,
                    awbCode: shipmentResult.awb,
                    user_id: req.user._id,
                    userEmail: req.user.email
                });

            } catch (emailError) {
                LoggingService.shippingError('Failed to send shipping notification email', {
                    correlationId,
                    orderId: order._id,
                    orderNumber: order.order_number,
                    customerEmail: order.shippingDetails?.email || order.shipping_email,
                    emailError: emailError.message,
                    user_id: req.user._id,
                    userEmail: req.user.email
                });
                // Email failure doesn't affect the shipping process
            }
        } catch (shipmentError) {
            LoggingService.shippingError('Error creating automatic shipment', {
                correlationId,
                orderId: order._id,
                orderNumber: order.order_number,
                user_id: req.user._id,
                userEmail: req.user.email
            }, shipmentError);
            // Continue with payment success response, shipment can be created manually later
        }

        // Payment capture handling
        try {
            LoggingService.paymentInfo('Attempting payment capture', {
                correlationId,
                orderId: order._id,
                orderNumber: order.order_number,
                razorpay_payment_id,
                amount: order.total_amount,
                user_id: req.user._id,
                userEmail: req.user.email
            });

            // Capture payment if it's not auto-captured
            await razorpayService.capturePayment(razorpay_payment_id, order.total_amount * 100); // Convert to paise

            LoggingService.paymentAudit('PAYMENT_CAPTURED', {
                correlationId,
                orderId: order._id,
                orderNumber: order.order_number,
                razorpay_payment_id,
                amount: order.total_amount,
                user_id: req.user._id,
                userEmail: req.user.email
            });

        } catch (captureError) {
            LoggingService.paymentError('Payment capture failed', {
                correlationId,
                orderId: order._id,
                orderNumber: order.order_number,
                razorpay_payment_id,
                amount: order.total_amount,
                user_id: req.user._id,
                userEmail: req.user.email
            }, captureError);
            // In real implementation, this might require manual intervention
        }

        LoggingService.paymentInfo('Payment verification completed successfully', {
            correlationId,
            orderId: order._id,
            orderNumber: order.order_number,
            razorpay_payment_id,
            shippingCreated: !!order.shipping?.awbCode,
            totalDuration: Date.now() - startTime,
            user_id: req.user._id,
            userEmail: req.user.email
        });

        res.status(200).json({
            success: true,
            data: {
                paymentVerified: true,
                order: {
                    id: order._id,
                    orderNumber: order.order_number,
                    status: order.status,
                    paymentStatus: order.payment_status,
                    paymentId: order.paymentId,
                    paymentMethod: order.paymentMethod,
                    totalAmount: order.total_amount,
                    paymentCompletedAt: order.paymentCompletedAt,
                    // Include shipping information if available
                    shipping: order.shipping ? {
                        status: order.shipping.status,
                        awbCode: order.shipping.awbCode,
                        courierName: order.shipping.courierName,
                        trackingUrl: order.shipping.trackingUrl,
                        estimatedDeliveryDate: order.shipping.estimatedDeliveryDate,
                        shippedAt: order.shipping.shippedAt
                    } : null
                },
                // Additional verification data
                verification: {
                    razorpay_order_id,
                    razorpay_payment_id,
                    verifiedAt: new Date().toISOString(),
                    method: 'razorpay_production'
                }
            },
            message: order.shipping?.awbCode
                ? `Payment verified and shipment created successfully. Tracking: ${order.shipping.awbCode}`
                : 'Payment verified successfully'
        });

    } catch (error) {
        LoggingService.paymentError('Payment verification error', {
            correlationId,
            orderId: req.body.orderId,
            razorpay_order_id: req.body.razorpay_order_id,
            razorpay_payment_id: req.body.razorpay_payment_id,
            user_id: req.user?._id,
            userEmail: req.user?.email,
            duration: Date.now() - startTime
        }, error);

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to verify payment',
                code: 'VERIFY_PAYMENT_ERROR'
            }
        });
    }
};

// @desc    Handle Razorpay webhook
// @route   POST /api/payments/webhook
// @access  Public (but secured with webhook signature)
const handlePaymentWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookBody = JSON.stringify(req.body);

        // Enhanced webhook signature verification
        let isValidWebhookSignature = false;

        try {
            // Use Razorpay service for webhook validation
            isValidWebhookSignature = razorpayService.validateWebhookSignature(
                webhookBody,
                webhookSignature
            );
        } catch (verificationError) {
            console.error('Webhook signature verification failed:', verificationError);
            return res.status(400).json({
                error: 'Webhook signature verification failed',
                code: 'INVALID_WEBHOOK_SIGNATURE'
            });
        }

        if (!isValidWebhookSignature) {
            console.warn('Invalid webhook signature received:', {
                signature: webhookSignature,
                timestamp: new Date().toISOString()
            });
            return res.status(400).json({
                error: 'Invalid webhook signature',
                code: 'INVALID_WEBHOOK_SIGNATURE'
            });
        }

        // Handle different webhook events with comprehensive scenarios
        const event = req.body.event;
        const paymentEntity = req.body.payload?.payment?.entity;
        const orderEntity = req.body.payload?.order?.entity;

        console.log(`Processing webhook event: ${event}`, {
            paymentId: paymentEntity?.id,
            orderId: orderEntity?.id,
            timestamp: new Date().toISOString()
        });

        // Enhanced webhook verification - Cross-verify with direct API call
        let webhookVerificationResult = null;
        if (paymentEntity?.id) {
            webhookVerificationResult = await performAdditionalPaymentVerification(paymentEntity.id);
        }

        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(paymentEntity, webhookVerificationResult);
                break;

            case 'payment.failed':
                await handlePaymentFailed(paymentEntity, webhookVerificationResult);
                break;

            case 'payment.authorized':
                await handlePaymentAuthorized(paymentEntity, webhookVerificationResult);
                break;

            case 'order.paid':
                await handleOrderPaid(orderEntity, webhookVerificationResult);
                break;

            case 'payment.dispute.created':
                await handlePaymentDispute(paymentEntity, webhookVerificationResult);
                break;

            default:
                console.log('Unhandled webhook event:', event);
                // Log unhandled events for monitoring
                break;
        }

        res.status(200).json({
            status: 'success',
            event: event,
            processed_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error handling payment webhook:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to handle webhook',
                code: 'WEBHOOK_ERROR'
            }
        });
    }
};

// Enhanced payment verification function for webhook cross-verification
async function performAdditionalPaymentVerification(paymentId) {
    try {
        console.log(`Performing additional verification for payment: ${paymentId}`);

        // Fetch payment details directly from Razorpay API for cross-verification
        const paymentDetails = await razorpayService.getPaymentDetails(paymentId);

        console.log('Additional verification result:', {
            paymentId,
            status: paymentDetails.status,
            amount: paymentDetails.amount,
            method: paymentDetails.method,
            captured: paymentDetails.captured
        });

        return {
            success: true,
            verified: true,
            paymentDetails,
            verifiedAt: new Date()
        };
    } catch (error) {
        console.error('Additional payment verification failed:', error);
        return {
            success: false,
            verified: false,
            error: error.message,
            verifiedAt: new Date()
        };
    }
}

// Helper functions for webhook event handling
async function handlePaymentCaptured(paymentEntity, verificationResult = null) {
    try {
        // Find order by payment ID or order receipt
        const order = await Order.findOne({
            $or: [
                { paymentId: paymentEntity.id },
                { razorpay_order_id: paymentEntity.order_id }
            ]
        });

        if (order) {
            // Enhanced verification: Cross-check with additional verification result
            if (verificationResult) {
                if (verificationResult.verified && verificationResult.paymentDetails) {
                    console.log(`✅ Webhook payment captured cross-verified via API for order ${order.order_number}`);

                    // Store additional verification metadata
                    order.webhookVerification = {
                        verified: true,
                        verifiedAt: verificationResult.verifiedAt,
                        paymentStatus: verificationResult.paymentDetails.status,
                        paymentMethod: verificationResult.paymentDetails.method,
                        captured: verificationResult.paymentDetails.captured
                    };
                } else {
                    console.warn(`⚠️ Webhook payment captured but additional verification failed for order ${order.order_number}`);

                    order.webhookVerification = {
                        verified: false,
                        verifiedAt: verificationResult.verifiedAt,
                        error: verificationResult.error
                    };
                }
            }

            order.payment_status = 'completed';
            order.status = 'confirmed';
            order.paymentCompletedAt = new Date(paymentEntity.created_at * 1000);
            await order.save();

            console.log(`Payment captured for order ${order.order_number}`);

            // Here you could trigger additional actions like:
            // - Send confirmation email
            // - Update inventory
            // - Trigger fulfillment process
        }
    } catch (error) {
        console.error('Error handling payment captured:', error);
    }
}

async function handlePaymentFailed(paymentEntity, verificationResult = null) {
    try {
        const order = await Order.findOne({
            $or: [
                { paymentId: paymentEntity.id },
                { razorpay_order_id: paymentEntity.order_id }
            ]
        });

        if (order) {
            order.payment_status = 'FAILED';
            order.status = 'cancelled';
            order.paymentFailureReason = paymentEntity.error_description || 'Payment failed';
            await order.save();

            console.log(`Payment failed for order ${order.order_number}: ${order.paymentFailureReason}`);

            // Additional actions:
            // - Send failure notification
            // - Release inventory hold
            // - Suggest retry or alternative payment methods
        }
    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
}

async function handlePaymentAuthorized(paymentEntity, verificationResult = null) {
    try {
        const order = await Order.findOne({
            razorpay_order_id: paymentEntity.order_id
        });

        if (order) {
            order.payment_status = 'AUTHORIZED';
            order.paymentId = paymentEntity.id;
            await order.save();

            console.log(`Payment authorized for order ${order.order_number}`);

            // In auto-capture mode, this would trigger capture
            // In manual capture mode, you'd wait for manual capture
        }
    } catch (error) {
        console.error('Error handling payment authorized:', error);
    }
}

async function handleOrderPaid(orderEntity, verificationResult = null) {
    try {
        const order = await Order.findOne({
            razorpay_order_id: orderEntity.id
        });

        if (order && order.payment_status !== 'completed') {
            order.payment_status = 'completed';
            order.status = 'confirmed';
            await order.save();

            console.log(`Order paid confirmed: ${order.order_number}`);
        }
    } catch (error) {
        console.error('Error handling order paid:', error);
    }
}

async function handlePaymentDispute(paymentEntity, verificationResult = null) {
    try {
        const order = await Order.findOne({
            paymentId: paymentEntity.id
        });

        if (order) {
            order.payment_status = 'DISPUTED';
            order.disputeReason = paymentEntity.dispute_reason || 'Payment disputed';
            await order.save();

            console.log(`Payment dispute for order ${order.order_number}: ${order.disputeReason}`);

            // Additional actions:
            // - Alert admin
            // - Prepare dispute response
            // - Hold fulfillment if not shipped
        }
    } catch (error) {
        console.error('Error handling payment dispute:', error);
    }
}

// @desc    Get payment service status and health
// @route   GET /api/payments/status
// @access  Public
const getPaymentServiceStatus = async (req, res) => {
    try {
        const serviceStatus = {
            service: 'Razorpay Payment Gateway',
            status: 'operational',
            environment: process.env.NODE_ENV || 'development',
            razorpayMode: process.env.RAZORPAY_KEY_ID ? 'configured' : 'not_configured',
            webhookSupport: 'enabled',
            supportedMethods: ['card', 'netbanking', 'wallet', 'upi'],
            currency: 'INR',
            features: {
                recurringPayments: false,
                instantRefunds: true,
                webhooks: true,
                disputeManagement: true
            }
        };

        res.status(200).json({
            success: true,
            data: serviceStatus,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting payment service status:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get payment service status',
                code: 'PAYMENT_STATUS_ERROR'
            }
        });
    }
};

// @desc    Get payment status for a specific order
// @route   GET /api/payments/order/:orderId/status
// @access  Private
const getOrderPaymentStatus = async (req, res) => {
    const startTime = Date.now();
    const correlationId = req.correlationId || LoggingService.generateCorrelationId();

    try {
        const { orderId } = req.params;

        LoggingService.paymentInfo('Order payment status check started', {
            correlationId,
            orderId,
            user_id: req.user._id,
            userEmail: req.user.email,
            ip: req.ip
        });

        // Find the order
        const order = await Order.findOne({
            _id: orderId,
            user_id: req.user._id
        }).select('paymentStatus razorpay_order_id razorpay_payment_id totalAmount createdAt updatedAt');

        if (!order) {
            LoggingService.paymentError('Order payment status check failed - Order not found', {
                correlationId,
                orderId,
                user_id: req.user._id,
                userEmail: req.user.email,
                responseTime: Date.now() - startTime
            });

            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        // Prepare payment status response
        const paymentData = {
            orderId: order._id,
            paymentStatus: order.payment_status,
            amount: order.total_amount,
            razorpay_order_id: order.razorpay_order_id,
            razorpay_payment_id: order.razorpay_payment_id,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };

        // If payment is not yet completed, optionally check with Razorpay for latest status
        if (order.payment_status === 'CREATED' && order.razorpay_order_id) {
            try {
                const razorpayOrderDetails = await razorpayService.getOrderDetails(order.razorpay_order_id);
                if (razorpayOrderDetails && razorpayOrderDetails.status) {
                    paymentData.razorpayStatus = razorpayOrderDetails.status;
                }
            } catch (statusError) {
                // Log but don't fail the request
                LoggingService.paymentWarn('Failed to fetch Razorpay order status', {
                    correlationId,
                    orderId,
                    razorpay_order_id: order.razorpay_order_id,
                    error: statusError.message
                });
            }
        }

        LoggingService.paymentInfo('Order payment status check completed', {
            correlationId,
            orderId,
            paymentStatus: order.payment_status,
            user_id: req.user._id,
            userEmail: req.user.email,
            responseTime: Date.now() - startTime
        });

        res.json({
            success: true,
            data: {
                payment: paymentData
            }
        });

    } catch (error) {
        LoggingService.paymentError('Order payment status check failed', {
            correlationId,
            orderId: req.params.orderId,
            user_id: req.user?._id,
            userEmail: req.user?.email,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - startTime
        });

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get order payment status',
                code: 'PAYMENT_STATUS_ERROR'
            }
        });
    }
};

// @desc    Create refund for an order
// @route   POST /api/payments/refund
// @access  Private (Admin) or order owner
const createRefund = async (req, res) => {
    const startTime = Date.now();
    const correlationId = req.correlationId || LoggingService.generateCorrelationId();

    try {
        const { orderId, amount, reason, notes } = req.body;

        LoggingService.paymentInfo('Refund creation started', {
            correlationId,
            orderId,
            amount,
            reason,
            user_id: req.user._id,
            userEmail: req.user.email,
            ip: req.ip
        });

        // Find the order
        const order = await Order.findById(orderId);

        if (!order) {
            LoggingService.paymentError('Refund creation failed - Order not found', {
                correlationId,
                orderId,
                user_id: req.user._id,
                userEmail: req.user.email
            });

            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        // Check if user has permission (order owner or admin)
        if (order.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            LoggingService.paymentError('Refund creation failed - Unauthorized access', {
                correlationId,
                orderId,
                orderuser_id: order.user_id,
                requestuser_id: req.user._id,
                userRole: req.user.role
            });

            return res.status(403).json({
                success: false,
                error: {
                    message: 'Unauthorized access to order',
                    code: 'UNAUTHORIZED_ACCESS'
                }
            });
        }

        // Validate refund eligibility
        if (order.payment_status !== 'completed') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Order payment not completed',
                    code: 'PAYMENT_NOT_COMPLETED'
                }
            });
        }

        if (!order.razorpay_payment_id) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Payment ID not found',
                    code: 'PAYMENT_ID_MISSING'
                }
            });
        }

        // Validate refund amount
        const refundAmount = amount || order.refundableAmount;
        if (refundAmount <= 0 || refundAmount > order.refundableAmount) {
            return res.status(400).json({
                success: false,
                error: {
                    message: `Invalid refund amount. Maximum refundable: ₹${order.refundableAmount}`,
                    code: 'INVALID_REFUND_AMOUNT'
                }
            });
        }

        // Create refund through Razorpay
        const razorpayRefund = await razorpayService.createRefund(
            order.razorpay_payment_id,
            refundAmount,
            reason
        );

        // Add refund to order
        await order.addRefund({
            amount: refundAmount,
            reason: reason || 'Customer requested refund',
            initiatedBy: req.user._id,
            notes,
            metadata: {
                originalPaymentId: order.razorpay_payment_id,
                gateway: 'razorpay',
                gatewayResponse: razorpayRefund
            }
        });

        // Update refund status based on Razorpay response
        const newRefund = order.refunds[order.refunds.length - 1];
        await order.updateRefundStatus(newRefund.refundId, razorpayRefund.status, {
            razorpayRefundId: razorpayRefund.refundId,
            gatewayResponse: razorpayRefund
        });

        LoggingService.paymentInfo('Refund created successfully', {
            correlationId,
            orderId,
            refundId: newRefund.refundId,
            razorpayRefundId: razorpayRefund.refundId,
            amount: refundAmount,
            user_id: req.user._id,
            userEmail: req.user.email,
            responseTime: Date.now() - startTime
        });

        res.status(201).json({
            success: true,
            data: {
                refund: {
                    refundId: newRefund.refundId,
                    razorpayRefundId: razorpayRefund.refundId,
                    amount: refundAmount,
                    status: razorpayRefund.status,
                    reason,
                    initiatedAt: newRefund.initiatedAt
                },
                order: {
                    refundStatus: order.refundStatus,
                    totalRefunded: order.totalRefunded,
                    refundableAmount: order.refundableAmount
                }
            }
        });

    } catch (error) {
        LoggingService.paymentError('Refund creation failed', {
            correlationId,
            orderId: req.body.orderId,
            user_id: req.user?._id,
            userEmail: req.user?.email,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - startTime
        });

        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to create refund',
                code: 'REFUND_CREATION_ERROR'
            }
        });
    }
};

// @desc    Get refund details
// @route   GET /api/payments/refund/:refundId
// @access  Private (Admin) or order owner
const getRefundDetails = async (req, res) => {
    const startTime = Date.now();
    const correlationId = req.correlationId || LoggingService.generateCorrelationId();

    try {
        const { refundId } = req.params;

        LoggingService.paymentInfo('Refund details retrieval started', {
            correlationId,
            refundId,
            user_id: req.user._id,
            userEmail: req.user.email,
            ip: req.ip
        });

        // Find order with this refund
        const order = await Order.findOne({ 'refunds.refundId': refundId });

        if (!order) {
            LoggingService.paymentError('Refund details retrieval failed - Refund not found', {
                correlationId,
                refundId,
                user_id: req.user._id
            });

            return res.status(404).json({
                success: false,
                error: {
                    message: 'Refund not found',
                    code: 'REFUND_NOT_FOUND'
                }
            });
        }

        // Check if user has permission
        if (order.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            LoggingService.paymentError('Refund details retrieval failed - Unauthorized access', {
                correlationId,
                refundId,
                orderuser_id: order.user_id,
                requestuser_id: req.user._id
            });

            return res.status(403).json({
                success: false,
                error: {
                    message: 'Unauthorized access',
                    code: 'UNAUTHORIZED_ACCESS'
                }
            });
        }

        const refund = order.getRefund(refundId);

        // Get latest status from Razorpay if available
        let razorpayRefundDetails = null;
        if (refund.razorpayRefundId) {
            try {
                razorpayRefundDetails = await razorpayService.getRefundDetails(refund.razorpayRefundId);
            } catch (statusError) {
                LoggingService.paymentWarn('Failed to fetch Razorpay refund status', {
                    correlationId,
                    refundId,
                    razorpayRefundId: refund.razorpayRefundId,
                    error: statusError.message
                });
            }
        }

        LoggingService.paymentInfo('Refund details retrieved successfully', {
            correlationId,
            refundId,
            status: refund.status,
            user_id: req.user._id,
            responseTime: Date.now() - startTime
        });

        res.json({
            success: true,
            data: {
                refund: {
                    refundId: refund.refundId,
                    razorpayRefundId: refund.razorpayRefundId,
                    amount: refund.amount,
                    reason: refund.reason,
                    status: refund.status,
                    initiatedAt: refund.initiatedAt,
                    processedAt: refund.processedAt,
                    notes: refund.notes
                },
                order: {
                    orderId: order._id,
                    orderNumber: order.order_number,
                    totalAmount: order.total_amount,
                    refundStatus: order.refundStatus,
                    totalRefunded: order.totalRefunded
                },
                razorpayDetails: razorpayRefundDetails
            }
        });

    } catch (error) {
        LoggingService.paymentError('Refund details retrieval failed', {
            correlationId,
            refundId: req.params.refundId,
            user_id: req.user?._id,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - startTime
        });

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get refund details',
                code: 'REFUND_DETAILS_ERROR'
            }
        });
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment,
    handlePaymentWebhook,
    getPaymentServiceStatus,
    getOrderPaymentStatus,
    createRefund,
    getRefundDetails
};
