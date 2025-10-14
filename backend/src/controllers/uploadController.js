const Order = require('../models/Order');

// @desc    Upload certificate for order item
// @route   POST /api/orders/:id/upload
// @access  Private
const uploadOrderCertificate = async (req, res) => {
    try {
        const { id: orderId } = req.params;
        const { orderItemId } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'No file uploaded',
                    code: 'NO_FILE'
                }
            });
        }

        // Find the order
        const order = await Order.findOne({
            _id: orderId,
            userId: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order not found',
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        // Find the specific order item
        const orderItem = order.items.find(item =>
            item._id.toString() === orderItemId
        );

        if (!orderItem) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Order item not found',
                    code: 'ORDER_ITEM_NOT_FOUND'
                }
            });
        }

        // Update the order item with certificate info
        orderItem.certificate = {
            fileName: req.file.originalname,
            fileUrl: `/uploads/certificates/${req.file.filename}`
        };

        await order.save();

        res.status(200).json({
            success: true,
            data: {
                fileUrl: orderItem.certificate.fileUrl,
                fileName: orderItem.certificate.fileName
            },
            message: 'Certificate uploaded successfully'
        });

    } catch (error) {
        console.error('Error uploading certificate:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to upload certificate',
                code: 'UPLOAD_ERROR'
            }
        });
    }
};

// @desc    Upload product images (Admin only)
// @route   POST /api/admin/products/:id/images
// @access  Private (Admin)
const uploadProductImages = async (req, res) => {
    try {
        const { id: productId } = req.params;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'No files uploaded',
                    code: 'NO_FILES'
                }
            });
        }

        const Product = require('../models/Product');
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                }
            });
        }

        // Add new image URLs to product
        const newImageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
        product.images = [...product.images, ...newImageUrls];

        await product.save();

        res.status(200).json({
            success: true,
            data: {
                imageUrls: newImageUrls,
                totalImages: product.images.length
            },
            message: 'Product images uploaded successfully'
        });

    } catch (error) {
        console.error('Error uploading product images:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to upload product images',
                code: 'UPLOAD_ERROR'
            }
        });
    }
};

// @desc    Delete product image (Admin only)
// @route   DELETE /api/admin/products/:id/images/:imageIndex
// @access  Private (Admin)
const deleteProductImage = async (req, res) => {
    try {
        const { id: productId, imageIndex } = req.params;
        const index = parseInt(imageIndex);

        const Product = require('../models/Product');
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                }
            });
        }

        if (index < 0 || index >= product.images.length) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid image index',
                    code: 'INVALID_INDEX'
                }
            });
        }

        // Remove image from array
        const removedImage = product.images[index];
        product.images.splice(index, 1);

        await product.save();

        // TODO: Delete physical file from filesystem
        // const fs = require('fs');
        // const imagePath = path.join(__dirname, '../../uploads/products', removedImage);
        // if (fs.existsSync(imagePath)) {
        //     fs.unlinkSync(imagePath);
        // }

        res.status(200).json({
            success: true,
            data: {
                removedImage,
                remainingImages: product.images
            },
            message: 'Product image deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting product image:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete product image',
                code: 'DELETE_ERROR'
            }
        });
    }
};

module.exports = {
    uploadOrderCertificate,
    uploadProductImages,
    deleteProductImage
};