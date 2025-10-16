const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

// @desc    Get all active products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Handle sorting parameters
        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        // Map frontend sort fields to backend fields
        const sortFieldMap = {
            'created_at': 'created_at',
            'createdAt': 'created_at',
            'name': 'name',
            'price': 'created_at', // fallback to created_at since price is in variants
            'updated_at': 'updated_at',
            'updatedAt': 'updated_at'
        };

        const sortField = sortFieldMap[sortBy] || 'created_at';
        const sortOptions = { [sortField]: sortOrder };

        // Find only active products with variants
        const products = await Product.find({
            is_active: true,
            status: 'active',
            deleted_at: null
        })
            .select('-__v')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        // Get variants for each product
        const productsWithVariants = await Promise.all(
            products.map(async (product) => {
                const variants = await ProductVariant.find({
                    product_id: product._id,
                    is_available: true
                }).select('-__v');

                return {
                    ...product.toJSON(),
                    product_variants: variants
                };
            })
        );

        // Get total count for pagination
        const total = await Product.countDocuments({
            is_active: true,
            status: 'active',
            deleted_at: null
        });
        const pages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: {
                products: productsWithVariants,
                total,
                page,
                totalPages: pages
            }
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch products',
                code: 'FETCH_PRODUCTS_ERROR'
            }
        });
    }
};

// @desc    Get product by slug
// @route   GET /api/products/:slug
// @access  Public
const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const product = await Product.findOne({
            slug: slug.toLowerCase(),
            is_active: true,
            status: 'active',
            deleted_at: null
        }).select('-__v');

        if (!product) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                }
            });
        }

        // Get product variants
        const variants = await ProductVariant.find({
            product_id: product._id,
            is_available: true
        }).select('-__v');

        // Increment view count
        product.incrementViewCount();

        const productWithVariants = {
            ...product.toJSON(),
            product_variants: variants
        };

        res.status(200).json({
            success: true,
            data: productWithVariants
        });

    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch product',
                code: 'FETCH_PRODUCT_ERROR'
            }
        });
    }
};

// @desc    Create new product (Admin only)
// @route   POST /api/admin/products
// @access  Private (Admin)
const createProduct = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            material,
            is_active,
            meta_title,
            meta_description,
            meta_keywords,
            category,
            sub_category,
            tags,
            weight,
            dimensions,
            features,
            customization,
            manufacturing,
            images,
            variants
        } = req.body;

        // Check if slug already exists
        const existingProduct = await Product.findOne({ slug: slug.toLowerCase() });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Product with this slug already exists',
                    code: 'SLUG_EXISTS'
                }
            });
        }

        // Check for duplicate SKUs in variants
        const skus = variants.map(v => v.sku.toUpperCase());
        const uniqueSkus = [...new Set(skus)];
        if (skus.length !== uniqueSkus.length) {
            // Find duplicate SKUs for better error message
            const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index);
            return res.status(400).json({
                success: false,
                error: {
                    message: `Duplicate SKUs found in variants: ${duplicates.join(', ')}`,
                    code: 'DUPLICATE_SKU',
                    duplicates: duplicates
                }
            });
        }

        // Check if any SKU already exists in ProductVariant collection
        const existingVariants = await ProductVariant.find({
            sku: { $in: uniqueSkus }
        });
        if (existingVariants.length > 0) {
            const existingSkus = existingVariants.map(v => v.sku);
            return res.status(400).json({
                success: false,
                error: {
                    message: `The following SKUs already exist: ${existingSkus.join(', ')}. Please use different SKUs for your variants.`,
                    code: 'SKU_EXISTS',
                    existingSkus: existingSkus
                }
            });
        }

        // Create the product first (without variants)
        const product = await Product.create({
            name,
            slug: slug ? slug.toLowerCase() : name.toLowerCase().replace(/\s+/g, '-'),
            description,
            material: material || '25mm Premium Clear Acrylic',
            is_active: is_active !== false, // default to true
            meta_title,
            meta_description,
            meta_keywords: meta_keywords || [],
            category: category || 'award',
            sub_category,
            tags: tags || [],
            weight,
            dimensions: dimensions || {
                length: 0,
                width: 0,
                height: 0,
                unit: 'cm'
            },
            features: features || [],
            customization: customization || {
                is_customizable: true,
                options: []
            },
            manufacturing: manufacturing || {
                production_time: 7,
                complexity_level: 'moderate',
                requires_approval: true
            },
            images: images || []
        });

        // Create variants separately and link to product
        if (variants && variants.length > 0) {
            const variantDocuments = variants.map(variant => ({
                product_id: product._id,
                size: variant.size,
                sku: variant.sku.toUpperCase(),
                price: variant.price,
                compare_at_price: variant.compare_at_price,
                is_available: variant.is_available !== false, // default to true
                stock_quantity: variant.stock_quantity || 50
            }));

            await ProductVariant.insertMany(variantDocuments);
        }

        // Fetch the product with variants populated
        const productWithVariants = await Product.findById(product._id)
            .populate('product_variants');

        res.status(201).json({
            success: true,
            data: productWithVariants,
            message: 'Product created successfully'
        });

    } catch (error) {
        console.error('Error creating product:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));

            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create product',
                code: 'CREATE_PRODUCT_ERROR'
            }
        });
    }
};

// @desc    Get all products (Admin only)
// @route   GET /api/admin/products
// @access  Private (Admin)
const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || 'all';

        // Build query
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { 'variants.sku': { $regex: search, $options: 'i' } }
            ];
        }

        if (status !== 'all') {
            query.is_active = status === 'active';
        }

        const products = await Product.find(query)
            .select('-__v')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        // Get variants for each product
        const productsWithVariants = await Promise.all(
            products.map(async (product) => {
                const variants = await ProductVariant.find({
                    product_id: product._id
                }).select('-__v');

                return {
                    ...product.toJSON(),
                    product_variants: variants
                };
            })
        );

        const total = await Product.countDocuments(query);
        const pages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: productsWithVariants,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });

    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch products',
                code: 'FETCH_PRODUCTS_ERROR'
            }
        });
    }
};

// @desc    Update product
// @route   PUT /api/products/admin/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            slug,
            description,
            material,
            is_active,
            meta_title,
            meta_description,
            meta_keywords,
            category,
            sub_category,
            tags,
            weight,
            dimensions,
            features,
            customization,
            manufacturing,
            images,
            variants
        } = req.body;

        // Check if product exists
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                }
            });
        }

        // Generate slug from name if not provided or if name changed
        const productSlug = slug || (name && name !== existingProduct.name ?
            name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') :
            existingProduct.slug);

        // Prepare product update data
        const productUpdates = {
            name: name || existingProduct.name,
            slug: productSlug,
            description: description || existingProduct.description,
            material: material || existingProduct.material,
            is_active: is_active !== undefined ? is_active : existingProduct.is_active,

            // SEO fields
            meta_title: meta_title || existingProduct.meta_title,
            meta_description: meta_description || existingProduct.meta_description,
            meta_keywords: meta_keywords || existingProduct.meta_keywords,

            // Categories and tags
            category: category || existingProduct.category,
            sub_category: sub_category || existingProduct.sub_category,
            tags: tags || existingProduct.tags,

            // Physical properties
            weight: weight || existingProduct.weight,
            dimensions: dimensions || existingProduct.dimensions,

            // Product features
            features: features || existingProduct.features,

            // Customization options
            customization: customization || existingProduct.customization,

            // Manufacturing details
            manufacturing: manufacturing || existingProduct.manufacturing,

            // Images
            images: images || existingProduct.images,

            updated_at: new Date()
        };

        // Update product details (excluding variants)
        const product = await Product.findByIdAndUpdate(
            id,
            productUpdates,
            { new: true, runValidators: true }
        );

        // Handle variants update if provided
        if (variants && Array.isArray(variants)) {
            // Remove existing variants for this product
            await ProductVariant.deleteMany({ product_id: id });

            // Create new variants if any
            if (variants.length > 0) {
                const variantDocuments = variants.map(variant => ({
                    product_id: id,
                    size: variant.size,
                    sku: variant.sku.toUpperCase(),
                    price: variant.price,
                    compare_at_price: variant.compare_at_price,
                    is_available: variant.is_available !== false,
                    stock_quantity: variant.stock_quantity || 50
                }));

                await ProductVariant.insertMany(variantDocuments);
            }
        }

        // Fetch updated product with variants
        const productWithVariants = await Product.findById(id)
            .populate('product_variants');

        res.status(200).json({
            success: true,
            data: productWithVariants,
            message: 'Product updated successfully'
        });

    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update product',
                code: 'UPDATE_PRODUCT_ERROR'
            }
        });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/admin/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                }
            });
        }

        // Hard delete - actually remove the product from database
        await Product.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete product',
                code: 'DELETE_PRODUCT_ERROR'
            }
        });
    }
};

// @desc    Toggle product status (active/inactive)
// @route   PATCH /api/products/admin/:id/toggle
// @access  Private/Admin
const toggleProductStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                }
            });
        }

        // Toggle the active status
        product.is_active = !product.is_active;
        product.updated_at = new Date();
        await product.save();

        res.status(200).json({
            success: true,
            data: product,
            message: `Product ${product.is_active ? 'activated' : 'deactivated'} successfully`
        });

    } catch (error) {
        console.error('Error toggling product status:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to toggle product status',
                code: 'TOGGLE_PRODUCT_ERROR'
            }
        });
    }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = async (req, res) => {
    try {
        const {
            q: query,
            category,
            material,
            minPrice,
            maxPrice,
            tags,
            page = 1,
            limit = 10,
            sort = 'createdAt'
        } = req.query;

        const filters = {
            category,
            material,
            minPrice,
            maxPrice,
            tags: tags ? tags.split(',') : undefined
        };

        // Remove undefined filters
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined) {
                delete filters[key];
            }
        });

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let products = await Product.searchProducts(query, filters)
            .select('-__v')
            .skip(skip)
            .limit(parseInt(limit));

        // Apply sorting
        const sortOptions = {};
        switch (sort) {
            case 'price-low':
                products = products.sort((a, b) => a.minPrice - b.minPrice);
                break;
            case 'price-high':
                products = products.sort((a, b) => b.minPrice - a.minPrice);
                break;
            case 'name':
                products = products.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                sortOptions[sort] = -1;
        }

        if (Object.keys(sortOptions).length > 0) {
            products = await Product.searchProducts(query, filters)
                .select('-__v')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit));
        }

        // Get total count
        const totalProducts = await Product.searchProducts(query, filters).countDocuments();
        const pages = Math.ceil(totalProducts / parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                products,
                filters: {
                    query,
                    category,
                    material,
                    minPrice,
                    maxPrice,
                    tags: tags ? tags.split(',') : []
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalProducts,
                    pages
                }
            }
        });

    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to search products',
                code: 'SEARCH_PRODUCTS_ERROR'
            }
        });
    }
};

// @desc    Get all available materials
// @route   GET /api/products/materials
// @access  Public
const getMaterials = async (req, res) => {
    try {
        const materials = await Product.getAllMaterials();

        res.status(200).json({
            success: true,
            data: {
                materials
            }
        });

    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch materials',
                code: 'FETCH_MATERIALS_ERROR'
            }
        });
    }
};

// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = await Product.getAllCategories();

        res.status(200).json({
            success: true,
            data: {
                categories
            }
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch categories',
                code: 'FETCH_CATEGORIES_ERROR'
            }
        });
    }
};

// @desc    Check product availability
// @route   GET /api/products/availability/:productId
// @access  Public
const checkProductAvailability = async (req, res) => {
    try {
        const { productId } = req.params;
        const { variantId } = req.query;

        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                }
            });
        }

        let isAvailable = product.isAvailable;
        let variant = null;

        if (variantId) {
            isAvailable = product.checkVariantAvailability(variantId);
            variant = product.variants.id(variantId);
        }

        res.status(200).json({
            success: true,
            data: {
                isAvailable,
                product: {
                    id: product._id,
                    name: product.name,
                    isActive: product.isActive
                },
                variant: variant ? {
                    id: variant._id,
                    size: variant.size,
                    sku: variant.sku,
                    price: variant.price,
                    isAvailable: variant.isAvailable
                } : null
            }
        });

    } catch (error) {
        console.error('Error checking product availability:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to check product availability',
                code: 'CHECK_AVAILABILITY_ERROR'
            }
        });
    }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const products = await Product.find({
            category: category.toLowerCase(),
            isActive: true
        })
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments({
            category: category.toLowerCase(),
            isActive: true
        });
        const pages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            data: {
                products,
                category,
                pagination: {
                    page,
                    limit,
                    total,
                    pages
                }
            }
        });

    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch products by category',
                code: 'FETCH_PRODUCTS_BY_CATEGORY_ERROR'
            }
        });
    }
};

// @desc    Get product enum values for dropdowns
// @route   GET /api/products/enum-values
// @access  Public
const getProductEnumValues = async (req, res) => {
    try {
        const enumValues = {
            categories: ['award', 'trophy', 'plaque', 'certificate', 'medal', 'custom'],
            subCategories: [
                'precious_metals',
                'elite_collection',
                'diamond_collection',
                'starter_collection',
                'crystal_collection'
            ],
            materials: [
                '20mm Clear Acrylic',
                '25mm Premium Clear Acrylic',
                '30mm Premium Clear Acrylic',
                '30mm Ultra-Clear Crystal Acrylic',
                '30mm Premium Clear Acrylic with Diamond Cutting'
            ],
            sizes: [
                '15x15 cm',
                '18x18 cm',
                '20x20 cm',
                '22x22 cm',
                '25x25 cm',
                '30x30 cm',
                '35x35 cm'
            ],
            skuPrefixes: [
                'GOLD',
                'PLATINUM',
                'ELITE',
                'DIAMOND',
                'BRONZE',
                'CRYSTAL',
                'CUSTOM'
            ],
            complexityLevels: ['simple', 'moderate', 'complex'],
            dimensionUnits: ['mm', 'cm', 'inch'],
            commonMetaKeywords: [
                'trading award',
                'gold award',
                'platinum award',
                'acrylic award',
                'forex trading',
                'stock market',
                'investment',
                'achievement',
                'recognition',
                'premium award',
                'crystal award',
                'diamond award',
                'bronze award',
                'elite award',
                'custom award',
                'commemorative',
                'milestone',
                'beginner',
                'professional',
                'ultimate recognition',
                'exceptional achievement'
            ]
        };

        res.status(200).json({
            success: true,
            data: enumValues
        });

    } catch (error) {
        console.error('Error fetching enum values:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch enum values',
                code: 'ENUM_VALUES_ERROR'
            }
        });
    }
};

// @desc    Set product as featured
// @route   PATCH /api/products/admin/:id/featured
// @access  Private/Admin
const setFeaturedProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                }
            });
        }

        // Check if product is active
        if (!product.is_active || product.status !== 'active') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Only active products can be featured',
                    code: 'INACTIVE_PRODUCT'
                }
            });
        }

        // Set as featured (middleware will handle removing featured from others)
        product.is_featured = true;
        await product.save();

        res.status(200).json({
            success: true,
            data: {
                id: product._id,
                name: product.name,
                is_featured: product.is_featured
            },
            message: 'Product set as featured successfully'
        });

    } catch (error) {
        console.error('Error setting featured product:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to set featured product',
                code: 'SET_FEATURED_ERROR'
            }
        });
    }
};

// @desc    Remove featured status from product
// @route   DELETE /api/products/admin/:id/featured
// @access  Private/Admin
const removeFeaturedProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Product not found',
                    code: 'PRODUCT_NOT_FOUND'
                }
            });
        }

        // Remove featured status
        product.is_featured = false;
        await product.save();

        res.status(200).json({
            success: true,
            data: {
                id: product._id,
                name: product.name,
                is_featured: product.is_featured
            },
            message: 'Featured status removed successfully'
        });

    } catch (error) {
        console.error('Error removing featured product:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to remove featured product',
                code: 'REMOVE_FEATURED_ERROR'
            }
        });
    }
};

// @desc    Get current featured product
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProduct = async (req, res) => {
    try {
        const featuredProduct = await Product.findOne({
            is_featured: true,
            is_active: true,
            status: 'active',
            deleted_at: null
        });

        if (!featuredProduct) {
            return res.status(200).json({
                success: true,
                data: null,
                message: 'No featured product found'
            });
        }

        // Get variants for the featured product
        const variants = await ProductVariant.find({
            product_id: featuredProduct._id,
            is_available: true
        }).select('-__v');

        const productWithVariants = {
            ...featuredProduct.toJSON(),
            product_variants: variants
        };

        res.status(200).json({
            success: true,
            data: productWithVariants,
            message: 'Featured product retrieved successfully'
        });

    } catch (error) {
        console.error('Error getting featured product:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get featured product',
                code: 'GET_FEATURED_ERROR'
            }
        });
    }
};

module.exports = {
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
};