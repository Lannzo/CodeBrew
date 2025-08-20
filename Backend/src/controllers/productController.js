
const db = require('../config/db'); // Import the database config
const {validationResult} = require('express-validator');

exports.getAllProducts = async (req, res) => {
    try {
        // show active products to non admin
        let query = 'SELECT * FROM products WHERE is_active = TRUE ORDER BY product_name ASC';

        const includeInactive = req.query.includeInactive && 
                        (req.query.includeInactive.toLowerCase() === 'true' || req.query.includeInactive === '1');

        // for admin
        if (req.user.role === 'Admin' && includeInactive) {
        query = 'SELECT * FROM products ORDER BY product_name ASC';
        }

        const { rows } = await db.query(query);
        res.status(200).json(rows);
        
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

//get single product
exports.getProductById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const {productId} = req.params;

            // --- ADD THIS LOGGING BLOCK ---
        console.log('--- Fetching Product By ID ---');
        console.log('Time:', new Date().toISOString());
        console.log('Received productId param:', productId);
        console.log('Type of productId param:', typeof productId);
        console.log('----------------------------');
        // ------------------------------

        const {rows} = await db.query('SELECT * FROM products WHERE product_id = $1', [productId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

//create /  add product
exports.createProduct = async (req, res) => {
    const errors = validationResult(req);
    if(!errors) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { product_name, description, sku, price, image_url} = req.body;
    try {
        const query = `
        INSERT INTO products (product_name, description, sku, price, image_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *; `;
        const {rows } = await db.query(query, [product_name, description, sku, price, image_url]);
        res.status(201).json(rows[0]);
    }catch(error){
        if (error.code === '23505') {
            // Handle unique constraint violation (e.g., duplicate SKU)
            return res.status(409).json({ message: 'Product with this SKU already exists' });
        }
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }

};

exports.updateProduct = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { productId } = req.params;
        const { product_name, description, sku, price, image_url, is_active } = req.body;

        const { rows } = await db.query(`
            UPDATE products
            SET product_name = $1, description = $2, sku = $3, price = $4, image_url = $5, is_active = $6
            WHERE product_id = $7
            RETURNING *;
        `, [product_name, description, sku, price, image_url, is_active, productId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Product with this SKU already exists' });
        }
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

//deactivate product

exports.deleteProduct = async (req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { productId } = req.params;
        const result = await db.query('UPDATE products SET is_active = FALSE WHERE product_id = $1 RETURNING *', [productId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deactivated successfully', product: result.rows[0] });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};