const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
require('dotenv').config();

const verifyProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mytradeaward');
        console.log('Connected to MongoDB');

        const products = await Product.find({});
        const variants = await ProductVariant.find({});

        console.log(`\n📦 Products in database: ${products.length}`);
        products.forEach(product => {
            console.log(`  • ${product.name} (${product.slug}) - Active: ${product.is_active}`);
        });

        console.log(`\n🔧 Product variants in database: ${variants.length}`);
        variants.forEach(variant => {
            console.log(`  • ${variant.sku}: ${variant.size} - ₹${variant.price} (Stock: ${variant.stock_quantity})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error verifying products:', error);
        process.exit(1);
    }
};

verifyProducts();