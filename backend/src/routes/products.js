const express = require('express');
const {
    getProducts,
    getProductBySlug,
    createProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    searchProducts,
    getMaterials,
    getCategories,
    checkProductAvailability,
    getProductsByCategory,
    getProductEnumValues,
    setFeaturedProduct,
    removeFeaturedProduct,
    getFeaturedProduct
} = require('../controllers/productController');

const { uploadProductImages, deleteProductImage } = require('../controllers/uploadController');
const { uploadProductImage, handleUploadError } = require('../middleware/upload');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/materials', getMaterials);
router.get('/categories', getCategories);
router.get('/enum-values', getProductEnumValues);
router.get('/featured', getFeaturedProduct);
router.get('/availability/:productId', checkProductAvailability);
router.get('/category/:category', getProductsByCategory);
router.get('/:slug', getProductBySlug);

// Admin routes
router.get('/admin/all', authenticate, isAdmin, getAllProducts);
router.post('/admin/create', authenticate, isAdmin, createProduct);
router.put('/admin/:id', authenticate, isAdmin, updateProduct);
router.delete('/admin/:id', authenticate, isAdmin, deleteProduct);
router.patch('/admin/:id/toggle', authenticate, isAdmin, toggleProductStatus);
router.patch('/admin/:id/featured', authenticate, isAdmin, setFeaturedProduct);
router.delete('/admin/:id/featured', authenticate, isAdmin, removeFeaturedProduct);
router.post('/admin/:id/images', authenticate, isAdmin, uploadProductImage, handleUploadError, uploadProductImages);
router.delete('/admin/:id/images/:imageIndex', authenticate, isAdmin, deleteProductImage);

module.exports = router;