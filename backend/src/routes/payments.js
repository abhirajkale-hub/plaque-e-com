const express = require('express');
const {
    createPaymentOrder,
    verifyPayment,
    handlePaymentWebhook,
    getPaymentServiceStatus,
    getOrderPaymentStatus,
    createRefund,
    getRefundDetails
} = require('../controllers/paymentController');

const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Payment routes
router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);
router.post('/webhook', handlePaymentWebhook); // No auth required for webhook
router.get('/status', getPaymentServiceStatus); // Public status endpoint
router.get('/order/:orderId/status', authenticate, getOrderPaymentStatus); // Order-specific payment status

// Refund routes
router.post('/refund', authenticate, createRefund);
router.get('/refund/:refundId', authenticate, getRefundDetails);

module.exports = router;