const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate } = require('../middleware/auth');

// Customer routes - validate doesn't require auth, but apply and history do
router.post('/validate', couponController.validateCoupon);
router.post('/apply', authenticate, couponController.applyCoupon);
router.get('/history', authenticate, couponController.getUserCouponHistory);

module.exports = router;
