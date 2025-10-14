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

const { authenticate, isAdmin } = require('../middleware/auth');

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

module.exports = router;