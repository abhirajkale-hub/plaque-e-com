const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { authenticate } = require('../middleware/auth');

// Simple validation middleware
const validateShippingData = (req, res, next) => {
    if (req.method === 'POST' && !req.body) {
        return res.status(400).json({
            error: 'Request body is required',
            code: 'MISSING_BODY'
        });
    }
    next();
};

// Public Routes
router.get('/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Shipping service is running',
        timestamp: new Date().toISOString()
    });
});

// Tracking Routes (public)
router.get('/:identifier/track', shippingController.trackShipment);

// Webhook Routes
router.post('/webhook', shippingController.handleShippingWebhook);

// Protected Routes (require authentication)
router.use(authenticate);

// Shipment Management
router.post('/create', validateShippingData, shippingController.createShipment);

// Label Generation
router.post('/generate-label', validateShippingData, shippingController.generateShippingLabel);

// Cancel Shipment
router.post('/cancel', validateShippingData, shippingController.cancelShipment);

// Service Status
router.get('/status', shippingController.getShippingServiceStatus);

module.exports = router;
