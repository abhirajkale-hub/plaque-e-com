const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
    constructor () {
        this.isProduction = process.env.NODE_ENV === 'production';

        this.config = {
            keyId: process.env.RAZORPAY_KEY_ID,
            keySecret: process.env.RAZORPAY_KEY_SECRET,
            webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
        };

        // Initialize Razorpay instance
        this.validateConfig();
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        console.log(`Razorpay Service initialized in LIVE mode`);
    }

    /**
     * Validate Razorpay configuration
     */
    validateConfig() {
        const requiredEnvVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            throw new Error(`Missing required Razorpay environment variables: ${missingVars.join(', ')}`);
        }

        // Validate key format
        if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_')) {
            throw new Error('Invalid Razorpay Key ID format. Should start with "rzp_"');
        }

        console.log(`✅ Razorpay configuration validated`);
    }

    /**
     * Create Razorpay order
     */
    async createOrder(orderData) {
        try {
            // Validate input data
            this.validateOrderData(orderData);

            console.log('Creating Razorpay order:', {
                amount: orderData.amount,
                currency: orderData.currency,
                receipt: orderData.receipt
            });

            // Create order using Razorpay API
            const order = await this.razorpay.orders.create({
                amount: orderData.amount, // Amount in paise
                currency: orderData.currency,
                receipt: orderData.receipt,
                notes: orderData.notes || {},
                payment_capture: 1 // Auto capture payments
            });

            console.log('✅ Razorpay order created successfully:', order.id);
            return order;

        } catch (error) {
            console.error('❌ Razorpay order creation failed:', error);
            throw this.handleRazorpayError(error);
        }
    }

    /**
     * Verify payment signature
     * This ensures the payment response came from Razorpay
     */
    verifyPaymentSignature(orderId, paymentId, signature) {
        try {
            // Create the expected signature
            const data = `${orderId}|${paymentId}`;
            const expectedSignature = crypto
                .createHmac('sha256', this.config.keySecret)
                .update(data)
                .digest('hex');

            console.log('Verifying payment signature for:', {
                orderId,
                paymentId,
                expectedSignature: expectedSignature.substring(0, 10) + '...'
            });

            const isValid = expectedSignature === signature;

            if (isValid) {
                console.log('✅ Payment signature verification successful');
            } else {
                console.log('❌ Payment signature verification failed');
            }

            return isValid;

        } catch (error) {
            console.error('Payment signature verification error:', error);
            return false;
        }
    }

    /**
     * Get payment details from Razorpay
     */
    async getPaymentDetails(paymentId) {
        try {
            console.log('Fetching payment details for:', paymentId);

            const payment = await this.razorpay.payments.fetch(paymentId);

            console.log('✅ Payment details fetched successfully');
            return payment;

        } catch (error) {
            console.error('❌ Failed to fetch payment details:', error);
            throw this.handleRazorpayError(error);
        }
    }

    /**
     * Capture payment (for manual capture mode)
     */
    async capturePayment(paymentId, amount) {
        try {
            console.log('Capturing payment:', { paymentId, amount });

            const payment = await this.razorpay.payments.capture(paymentId, amount, 'INR');

            console.log('✅ Payment captured successfully');
            return payment;

        } catch (error) {
            console.error('❌ Payment capture failed:', error);
            throw this.handleRazorpayError(error);
        }
    }

    /**
     * Process refund
     */
    async processRefund(paymentId, amount, reason = 'Customer request') {
        try {
            console.log('Processing refund:', { paymentId, amount, reason });

            const refund = await this.razorpay.payments.refund(paymentId, {
                amount: amount,
                speed: 'normal',
                notes: {
                    reason: reason,
                    refund_initiated_at: new Date().toISOString()
                }
            });

            console.log('✅ Refund processed successfully:', refund.id);
            return refund;

        } catch (error) {
            console.error('❌ Refund processing failed:', error);
            throw this.handleRazorpayError(error);
        }
    }

    /**
     * Validate webhook signature
     */
    validateWebhookSignature(payload, signature) {
        try {
            if (!this.config.webhookSecret) {
                throw new Error('Webhook secret not configured');
            }

            // Generate expected signature
            const expectedSignature = crypto
                .createHmac('sha256', this.config.webhookSecret)
                .update(payload)
                .digest('hex');

            const isValid = expectedSignature === signature;

            if (isValid) {
                console.log('✅ Webhook signature validation successful');
            } else {
                console.log('❌ Webhook signature validation failed');
                console.log('Expected:', expectedSignature.substring(0, 10) + '...');
                console.log('Received:', signature ? signature.substring(0, 10) + '...' : 'null');
            }

            return isValid;

        } catch (error) {
            console.error('Webhook signature validation error:', error);
            return false;
        }
    }

    /**
     * Get order details from Razorpay
     */
    async getOrderDetails(orderId) {
        try {
            console.log('Fetching order details for:', orderId);

            const order = await this.razorpay.orders.fetch(orderId);

            console.log('✅ Order details fetched successfully');
            return order;

        } catch (error) {
            console.error('❌ Failed to fetch order details:', error);
            throw this.handleRazorpayError(error);
        }
    }

    /**
     * Get order payments
     */
    async getOrderPayments(orderId) {
        try {
            console.log('Fetching payments for order:', orderId);

            const payments = await this.razorpay.orders.fetchPayments(orderId);

            console.log('✅ Order payments fetched successfully');
            return payments;

        } catch (error) {
            console.error('❌ Failed to fetch order payments:', error);
            throw this.handleRazorpayError(error);
        }
    }

    /**
     * Validate order data before sending to Razorpay
     */
    validateOrderData(orderData) {
        if (!orderData.amount || orderData.amount < 100) {
            throw new Error('Invalid amount. Minimum amount is ₹1 (100 paise)');
        }

        if (!orderData.currency || orderData.currency !== 'INR') {
            throw new Error('Invalid currency. Only INR is supported');
        }

        if (!orderData.receipt) {
            throw new Error('Receipt is required for order creation');
        }

        // Validate amount is an integer (paise)
        if (!Number.isInteger(orderData.amount)) {
            throw new Error('Amount must be an integer (in paise)');
        }
    }

    /**
     * Handle and standardize Razorpay errors
     */
    handleRazorpayError(error) {
        console.error('Handling Razorpay error:', error);

        // Razorpay API error
        if (error.statusCode && error.error) {
            const razorpayError = error.error;
            return {
                code: razorpayError.code || 'RAZORPAY_ERROR',
                message: razorpayError.description || razorpayError.reason || 'Razorpay API error',
                statusCode: error.statusCode,
                field: razorpayError.field,
                source: razorpayError.source,
                step: razorpayError.step,
                reason: razorpayError.reason
            };
        }

        // Network or other errors
        return {
            code: 'PAYMENT_GATEWAY_ERROR',
            message: error.message || 'Payment gateway error',
            statusCode: 500
        };
    }

    /**
     * Create refund for a payment
     */
    async createRefund(paymentId, amount, reason = 'requested_by_customer') {
        try {
            console.log(`Creating refund for payment ${paymentId}, amount: ${amount}`);

            const refundData = {
                amount: Math.round(amount * 100), // Convert to paise
                speed: 'normal'
            };

            if (reason) {
                refundData.notes = { reason };
            }

            const refund = await this.razorpay.payments.refund(paymentId, refundData);

            console.log('✅ Refund created successfully:', refund.id);
            return {
                refundId: refund.id,
                amount: refund.amount / 100, // Convert back to rupees
                status: refund.status,
                createdAt: refund.created_at,
                speed: refund.speed,
                notes: refund.notes
            };

        } catch (error) {
            console.error('❌ Failed to create refund:', error);
            throw this.handleRazorpayError(error);
        }
    }

    /**
     * Get refund details
     */
    async getRefundDetails(refundId) {
        try {
            console.log('Fetching refund details for:', refundId);

            const refund = await this.razorpay.refunds.fetch(refundId);

            console.log('✅ Refund details fetched successfully');
            return {
                refundId: refund.id,
                paymentId: refund.payment_id,
                amount: refund.amount / 100, // Convert to rupees
                status: refund.status,
                createdAt: refund.created_at,
                processedAt: refund.processed_at,
                speed: refund.speed,
                notes: refund.notes
            };

        } catch (error) {
            console.error('❌ Failed to fetch refund details:', error);
            throw this.handleRazorpayError(error);
        }
    }

    /**
     * Get all refunds for a payment
     */
    async getPaymentRefunds(paymentId) {
        try {
            console.log('Fetching refunds for payment:', paymentId);

            const refunds = await this.razorpay.payments.fetchMultipleRefund(paymentId);

            console.log('✅ Payment refunds fetched successfully');
            return refunds.items.map(refund => ({
                refundId: refund.id,
                amount: refund.amount / 100,
                status: refund.status,
                createdAt: refund.created_at,
                processedAt: refund.processed_at,
                speed: refund.speed,
                notes: refund.notes
            }));

        } catch (error) {
            console.error('❌ Failed to fetch payment refunds:', error);
            throw this.handleRazorpayError(error);
        }
    }

    /**
     * Check if payment is refundable
     */
    async isPaymentRefundable(paymentId) {
        try {
            const payment = await this.getPaymentDetails(paymentId);
            return payment.status === 'captured' && payment.amount > 0;
        } catch (error) {
            console.error('❌ Failed to check payment refund eligibility:', error);
            return false;
        }
    }

    /**
     * Get service configuration status
     */
    getServiceStatus() {
        return {
            mode: 'live',
            environment: this.isProduction ? 'production' : 'development',
            keyId: this.config.keyId ? this.config.keyId.substring(0, 8) + '...' : 'Not configured',
            webhookConfigured: !!this.config.webhookSecret,
            initialized: !!this.razorpay
        };
    }
}

module.exports = new RazorpayService();