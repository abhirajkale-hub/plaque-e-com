const express = require('express');
const { getAllUsers, updateUserRole, deleteUser } = require('../controllers/userController');
const {
    getDashboardStats,
    getAnalytics,
    getRevenueChart,
    getOrderStatistics,
    getTopProducts,
    getUserStatistics,
    exportData
} = require('../controllers/statsController');
const {
    getAdminGalleryImages,
    uploadGalleryImage,
    addGalleryImageFromUrl,
    updateGalleryImage,
    deleteGalleryImage,
    reorderGalleryImages
} = require('../controllers/galleryController');
const {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon
} = require('../controllers/couponController');

const { authenticate, isAdmin } = require('../middleware/auth');
const { uploadGalleryImage: uploadMiddleware, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Admin Dashboard Statistics
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/revenue-chart', getRevenueChart);
router.get('/order-stats', getOrderStatistics);
router.get('/top-products', getTopProducts);
router.get('/user-stats', getUserStatistics);
router.get('/export/:type', exportData);

// Admin Order Management - REMOVED DUPLICATES
// Orders are managed through /orders/admin/* routes in orders.js

// Admin User Management  
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Admin Product Management - REMOVED DUPLICATES  
// Products are managed through /products/admin/* routes in products.js

// Admin Gallery Management
router.get('/gallery', getAdminGalleryImages);
router.post('/gallery/upload', uploadMiddleware, handleUploadError, uploadGalleryImage);
router.post('/gallery/url', addGalleryImageFromUrl);
router.put('/gallery/reorder', reorderGalleryImages);
router.put('/gallery/:id', updateGalleryImage);
router.delete('/gallery/:id', deleteGalleryImage);

// Admin Coupon Management
router.get('/coupons', getAllCoupons);
router.get('/coupons/:id', getCouponById);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

module.exports = router;