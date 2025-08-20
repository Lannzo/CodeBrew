
const db = require('../config/db'); // Import the database config
const {validationResult} = require('express-validator');

//create new order
exports.createOrder = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    //get branch and user info from auth user's token
    const { userId, branchId } = req.user;
    if (!branchId) {
        return res.status(400).json({ message: 'User is not assigned to a branch' });
    }

    const { items, payments, discounts, subtotal, tax_amount, discount_amount, total_amount } = req.body;

    //get client from the pool to run all queries in a single transaction
    const client = await db.getClient();

    try {
        //start transac
        await client.query('BEGIN');

        //insert to order table
        const orderQuery = `
            INSERT INTO orders (branch_id, user_id, subtotal, tax_amount, discount_amount, total_amount, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'completed')
            RETURNING *;
        `;
        const orderResult = await client.query(orderQuery, [branchId, userId, subtotal, tax_amount, discount_amount, total_amount]);
        const {order_id, order_date} = orderResult.rows[0];

        for (const item of items){
            await client.query(`
                INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                VALUES ($1, $2, $3, $4)
            `, [order_id, item.product_id, item.quantity, item.unit_price]
            ); 
        }

        // insert into the payments table
        for (const payment of payments) {
            await client.query(
                `INSERT INTO payments (order_id, payment_method_id, amount_paid)
                VALUES ($1, $2, $3)
                `, [order_id, payment.payment_method_id, payment.amount_paid]
            );
        }

        // instert into 'order_discounts table'
        if (discounts && discounts.length >0) {
            for (const discountId of discounts) {
                await client.query(
                    `INSERT INTO order_discounts (order_id, discount_id)
                    VALUES ($1, $2)
                    `, [order_id, discountId]
                );
            }
        }

        //update inventory and create inventory logs
        for (const item of items){
            
            const inventoryUpdateResult = await client.query(
                `UPDATE inventory
                SET quantity = quantity -$1
                WHERE product_id = $2 AND branch_id = $3
                RETURNING quantity;
                `, [item.quantity, item.product_id, branchId]
            );

            if (inventoryUpdateResult.rows.length === 0){
                throw new Error(`Inventory record not found for product ${item.product_id} at branch ${branchId}`);
            }
            const newQuantity = inventoryUpdateResult.rows[0].quantity;

            // Create audit log
            await client.query(
                `INSERT INTO inventory_logs (product_id, branch_id, user_id, change_quantity, new_quantity_on_hand, reason)
                VALUES ($1,$2,$3,$4,$5, 'sale');`, [item.product_id, branchId, userId, item.quantity, newQuantity]
            );
        }

        //commit transaction
        await client.query('COMMIT');

        res.status(201).json({
            message: 'Order created successfully',
            order: {order_id, order_date, total_amount}
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    } finally {
        client.release();
    }
};

// void order
exports.voidOrder = async (req, res) => {
    const { orderId } = req.params;
    const { userId } = req.user; //user voiding

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        //fetch the original order
        const orderResult = await client.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orderResult.rows[0];
        if (order.status === 'voided') {
            return res.status(400).json({ message: 'Order already voided' });
        }

        const originalBranchId = order.branch_id;

        //fetch items from the original order
        const itemsResult = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
        const items = itemsResult.rows;

        //update status to voided
        await client.query("UPDATE orders SET status = 'voided' WHERE order_id = $1", [orderId]);

        // reverse the inventory changes and create reversal logs
        for (const item of items) {
            const inventoryUpdateResult = await client.query(
                `UPDATE inventory
                 SET quantity = quantity +$1
                 WHERE product_id = $2 AND branch_id = $3
                 RETURNING quantity;
                `, [item.quantity, item.product_id, originalBranchId]
            );

            const newQuantity = inventoryUpdateResult.rows[0].quantity;

            await client.query(`
                INSERT INTO inventory_logs (product_id, branch_id, user_id, change_quantity, new_quantity_on_hand, reason, notes)
                VALUES ($1, $2, $3, $4, $5, 'void',$6);
            `, [item.product_id, originalBranchId, userId, item.quantity, newQuantity, `Reversal for order ${orderId}`]);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Order voided successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error voiding order:', error);
        res.status(500).json({ message: 'Failed to void order', error: error.message });
    } finally {
        client.release();
    }

};