const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
const certificatesDir = path.join(uploadDir, 'certificates');
const productsDir = path.join(uploadDir, 'products');
const galleryDir = path.join(uploadDir, 'gallery');

[uploadDir, certificatesDir, productsDir, galleryDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Storage configuration for certificates
const certificateStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, certificatesDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `cert_${uniqueSuffix}_${name}${ext}`);
    }
});

// Storage configuration for product images
const productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, productsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `product_${uniqueSuffix}_${name}${ext}`);
    }
});

// Storage configuration for gallery images
const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, galleryDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `gallery_${uniqueSuffix}_${name}${ext}`);
    }
});

// File filter for certificates (PDF, JPG, PNG)
const certificateFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG, and PNG files are allowed for certificates'));
    }
};

// File filter for product images (JPG, PNG)
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only JPG and PNG files are allowed for images'));
    }
};

// Certificate upload middleware
const uploadCertificate = multer({
    storage: certificateStorage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit to match frontend
    },
    fileFilter: certificateFileFilter
}).single('certificate');

// Product image upload middleware
const uploadProductImage = multer({
    storage: productStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: imageFileFilter
}).array('images', 10); // Allow up to 10 images

// Gallery image upload middleware
const uploadGalleryImage = multer({
    storage: galleryStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: imageFileFilter
}).single('image'); // Single image upload for gallery

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'File too large',
                    code: 'FILE_TOO_LARGE'
                }
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Too many files',
                    code: 'TOO_MANY_FILES'
                }
            });
        }
    }

    if (err.message.includes('Only')) {
        return res.status(400).json({
            success: false,
            error: {
                message: err.message,
                code: 'INVALID_FILE_TYPE'
            }
        });
    }

    next(err);
};

module.exports = {
    uploadCertificate,
    uploadProductImage,
    uploadGalleryImage,
    handleUploadError
};