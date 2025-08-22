const db = require('../config/db');
const { validationResult } = require('express-validator');

//get all settings
exports.getAllSettings = async (req, res) => {
    
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access Denied: Only Admins can access global settings.' });
    }
  
    try {
    const { rows } = await db.query('SELECT setting_key, setting_value FROM settings');
    
    // Transform the array of DB rows into a single key-value object
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});

    res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//Update
exports.updateSettings = async (req, res) => {

    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Access Denied: Only Admins can update global settings.' });
    }

    const settingsToUpdate = req.body;
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        for (const key in settingsToUpdate) {
        if (Object.hasOwnProperty.call(settingsToUpdate, key)) {
            const value = settingsToUpdate[key];
            await client.query(
            `INSERT INTO settings (setting_key, setting_value) 
            VALUES ($1, $2)
            ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2;`,
            [key, JSON.stringify(value)]
            );
        }
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Settings updated successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Failed to update settings.' });
    } finally {
        client.release();
    }
};

//payment settings
exports.getAllPaymentMethods = async (req, res) => {
    const { role, branchId: userBranchId } = req.user;
    const { branchId: queryBranchId } = req.query;

    let query;
    const queryParams = [];

    try {
        if (role === 'Admin') {
            // Admins can see all methods, or filter by a specific branch if they provide a query param.
            if (queryBranchId) {
                query = `
                    SELECT pm.* FROM payment_methods pm
                    JOIN branch_payment_methods bpm ON pm.payment_method_id = bpm.payment_method_id
                    WHERE bpm.branch_id = $1 ORDER BY pm.method_name ASC;
                `;
                queryParams.push(queryBranchId);
            } else {
                query = "SELECT * FROM payment_methods ORDER BY method_name ASC";
            }
        } else { // Role is Branch Officer or Cashier
            if (!userBranchId) {
                return res.status(200).json([]); // No branch assigned, no methods available.
            }
            query = `
                SELECT pm.* FROM payment_methods pm
                JOIN branch_payment_methods bpm ON pm.payment_method_id = bpm.payment_method_id
                WHERE pm.is_active = TRUE AND bpm.branch_id = $1
                ORDER BY pm.method_name ASC;
            `;
            queryParams.push(userBranchId);
        }

        const { rows } = await db.query(query, queryParams);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//create payment method
exports.createPaymentMethod = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { method_name } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO payment_methods (method_name) VALUES ($1) RETURNING *',
            [method_name]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'A payment method with this name already exists.' });
        }
        console.error('Error creating payment method:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//update payment method
exports.updatePaymentMethod = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { method_name, is_active } = req.body;
    try {
        const { rows } = await db.query(
            'UPDATE payment_methods SET method_name = $1, is_active = $2 WHERE payment_method_id = $3 RETURNING *',
            [method_name, is_active, id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Payment method not found.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'A payment method with this name already exists.' });
        }
        console.error('Error updating payment method:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//get discounts
exports.getAllDiscounts = async (req, res) => {
    const { role, branchId: userBranchId } = req.user;
    const { branchId: queryBranchId } = req.query;
    
    let query;
    const queryParams = [];

    try {
        if (role === 'Admin') {
            // Admins can see all discounts, or filter by branch
            if (queryBranchId) {
                query = `
                    SELECT d.* FROM discounts d
                    JOIN branch_discounts bd ON d.discount_id = bd.discount_id
                    WHERE bd.branch_id = $1 ORDER BY d.discount_name ASC;
                `;
                queryParams.push(queryBranchId);
            } else {
                query = "SELECT * FROM discounts ORDER BY discount_name ASC";
            }
        } else { // Role is Branch Officer or Cashier
            if (!userBranchId) {
                return res.status(200).json([]);
            }
            query = `
                SELECT d.* FROM discounts d
                JOIN branch_discounts bd ON d.discount_id = bd.discount_id
                WHERE d.is_active = TRUE AND bd.branch_id = $1
                AND (d.start_date IS NULL OR d.start_date <= NOW()) 
                AND (d.end_date IS NULL OR d.end_date >= NOW())
                ORDER BY d.discount_name ASC;
            `;
            queryParams.push(userBranchId);
        }

        const { rows } = await db.query(query, queryParams);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching discounts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//create discount
exports.createDiscount = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { discount_name, description, discount_type, discount_value, start_date, end_date } = req.body;
    try {
        const query = `
            INSERT INTO discounts (discount_name, description, discount_type, discount_value, start_date, end_date)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const { rows } = await db.query(query, [discount_name, description, discount_type, discount_value, start_date, end_date]);
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'A discount with this name already exists.' });
        }
        console.error('Error creating discount:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//update discount
exports.updateDiscount = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { discount_name, description, discount_type, discount_value, is_active, start_date, end_date } = req.body;
    try {
        const query = `
            UPDATE discounts SET 
                discount_name = $1, description = $2, discount_type = $3, discount_value = $4, is_active = $5, start_date = $6, end_date = $7
            WHERE discount_id = $8 RETURNING *;
        `;
        const { rows } = await db.query(query, [discount_name, description, discount_type, discount_value, is_active, start_date, end_date, id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Discount not found.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'A discount with this name already exists.' });
        }
        console.error('Error updating discount:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};