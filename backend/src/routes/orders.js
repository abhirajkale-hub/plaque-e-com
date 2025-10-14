const express = require('express');
const {
    createOrder,
    getUserOrders,
    getOrderById,
    getOrderByIdAdmin,
    getOrderTracking,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/orderController');

const { uploadOrderCertificate } = require('../controllers/uploadController');
const { uploadCertificate, handleUploadError } = require('../middleware/upload');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// User routes
router.post('/', authenticate, createOrder);
router.get('/', authenticate, getUserOrders);
router.get('/:id', authenticate, getOrderById);
router.get('/:id/track', authenticate, getOrderTracking);
router.put('/:id/cancel', authenticate, cancelOrder);

// Certificate upload route
router.post('/:id/upload', authenticate, uploadCertificate, handleUploadError, uploadOrderCertificate);

// Admin routes
router.get('/admin/all', authenticate, isAdmin, getAllOrders);
router.get('/admin/:id', authenticate, isAdmin, getOrderByIdAdmin);
router.put('/admin/:id/status', authenticate, isAdmin, updateOrderStatus);

module.exports = router;