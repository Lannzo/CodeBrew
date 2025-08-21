
const db= require('../config/db');
const {validationResult} = require('express-validator');

//get inventory
exports.getInventoryByBranch = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try{
        const {branchId} = req.params;

        if (req.user.role === 'Branch Officer' && req.user.branchId !== branchId) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this branch inventory.' });
        }

        const inventoryQuery = `
        SELECT i.inventory_id, i.quantity, i.low_stock_threshold, p.product_id, p.product_name, p.sku
        FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        WHERE i.branch_id = $1
        ORDER BY p.product_name ASC;
        `;

        const {rows} = await db.query(inventoryQuery, [branchId]);
        res.status(200).json(rows);

    }catch(error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

//adjust inventory
exports.adjustInventory = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {productId, branchId, changeQuantity, reason, notes} = req.body;
    const { userId, role } = req.user; //user

    if(role == 'Branch Officer' && branchId !== req.user.branchId) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this branch inventory.' });
    }

    const client = await db.getClient();

    try{
        await client.query('BEGIN');

        //update the inv quantity
        const inventoryUpdateQuery = `
        UPDATE inventory
        SET quantity = quantity + $1
        WHERE product_id = $2 AND branch_id = $3
        RETURNING quantity;
        `;

        const inventoryResult = await client.query(inventoryUpdateQuery, [changeQuantity, productId, branchId]);

        //check inventory records
        if(inventoryResult.rows.length === 0) {
            return res.status(404).json({ message: `Inventory record not found for product ID ${productId} and branch ID ${branchId}.` });
        }
        const newQuantity = inventoryResult.rows[0].quantity;

        //audit log for the adjustment
        const logQuery = `
        INSERT INTO inventory_logs (product_id, branch_id, user_id, change_quantity, new_quantity_on_hand, reason, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;
        await client.query(logQuery, [productId, branchId, userId, changeQuantity, newQuantity, reason, notes]);

        await client.query('COMMIT');

        res.status(200).json({
            message: `Inventory adjusted successfully for product ID ${productId} and branch ID ${branchId}.`,
            newQuantity: newQuantity
        });

    }catch(error){
        await client.query('ROLLBACK');
        console.error('Error adjusting inventory:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    } finally {
        client.release();
    }

};

//transfer products
exports.transferProducts = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {productId, fromBranchId, toBranchId, quantity, notes} = req.body;
    const {userId, role} = req.user; //user transferring

    if (role === 'Branch Officer' && fromBranchId !== req.user.branchId) {
        return res.status(403).json({ message: 'Forbidden: You do not have access to this branch inventory.' });
    }

    if (fromBranchId === toBranchId) {
        return res.status(400).json({ message: 'Cannot transfer products to the same branch.' });
    }

    if(quantity <= 0) {
        return res.status(400).json({ message: 'Invalid transfer quantity.' });
    }

    const client = await db.getClient();

    try{
        await client.query('BEGIN');

        const transferResult = await client.query(
            `INSERT INTO stock_transfers (from_branch_id, to_branch_id, initiated_by_user_id, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING *;
            `,
            [fromBranchId, toBranchId, userId, notes]
        );

        const transferId = transferResult.rows[0].transfer_id;
        const logNotes = `Transfer ID: ${transferId}, From Branch ID: ${fromBranchId}, To Branch ID: ${toBranchId}, Quantity: ${quantity}, Notes: ${notes}`;

        //decrement stock from source
        const fromUpdateResult = await client.query(
            `UPDATE inventory SET quantity = quantity - $1
             WHERE product_id = $2 AND branch_id = $3
             RETURNING quantity;`, [quantity, productId, fromBranchId]
        );
        if (fromUpdateResult.rows.length === 0 || fromUpdateResult.rows[0].quantity < 0) {
            return res.status(400).json({ message: 'Insufficient stock in source branch.' });
        }
        const fromNewQuantity = fromUpdateResult.rows[0].quantity;

        //create audit log for source
        await client.query(
            `INSERT INTO inventory_logs (product_id, branch_id, user_id, change_quantity, new_quantity_on_hand, reason, notes)
             VALUES ($1, $2, $3, $4, $5, 'transfer_out', $6);
            `,
            [productId, fromBranchId, userId, -quantity, fromNewQuantity, logNotes]
        );

        //increment
        const toUpdateResult = await client.query(
            `UPDATE inventory SET quantity = quantity + $1 
             WHERE product_id = $2 AND branch_id = $3
             RETURNING quantity`,
            [quantity, productId, toBranchId]
        );

        if(toUpdateResult.rows.length === 0) {
            await client.query(
                `INSERT INTO inventory (product_id, branch_id, quantity)
                 VALUES ($1, $2, $3)`,
                [productId, toBranchId, quantity]
            );
        }
        const toNewQuantity = toUpdateResult.rows.length > 0 ? toUpdateResult.rows[0].quantity : quantity;

        //audit log for destination
        await client.query(
            `INSERT INTO inventory_logs (product_id, branch_id, user_id, change_quantity, new_quantity_on_hand, reason, notes)
             VALUES ($1, $2, $3, $4, $5, 'transfer_in', $6)`,
            [productId, toBranchId, userId, quantity, toNewQuantity, logNotes]
        );

        await client.query('COMMIT');

        res.status(200).json({message: 'Product transfer successfully.', transferId});

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error transferring products:', error);

        if(error.message.includes('Insufficient stock')) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal server error.' });
        }

    } finally {
        client.release();
    }
};

