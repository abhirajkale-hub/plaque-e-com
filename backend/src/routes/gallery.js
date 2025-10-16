const express = require('express');
const { getGalleryImages } = require('../controllers/galleryController');

const router = express.Router();

// Public routes only
router.get('/', getGalleryImages);

module.exports = router;