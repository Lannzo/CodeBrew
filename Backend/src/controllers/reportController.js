const db = require('../config/db');
const { validationResult } = require('express-validator');

const buildReportWhereClause = (req) => {
  const { startDate, endDate, branchId } = req.query;
  const { role, branchId: userBranchId } = req.user;

  let whereClause = '';
  const queryParams = [];
  let paramIndex = 1;

  // Date filtering (assumes the table has a date column named 'order_date' or similar)
  if (startDate) {
    whereClause += ` AND order_date >= $${paramIndex++}`;
    queryParams.push(startDate);
  }
  if (endDate) {
    whereClause += ` AND order_date <= $${paramIndex++}`;
    queryParams.push(endDate);
  }

  // Branch filtering and authorization
  if (role === 'Admin') {
    if (branchId) {
      whereClause += ` AND branch_id = $${paramIndex++}`;
      queryParams.push(branchId);
    }
  } else { // Role is Branch Officer

    if (branchId && branchId !== userBranchId) {
      return { authError: true }; 
    }
    whereClause += ` AND branch_id = $${paramIndex++}`;
    queryParams.push(userBranchId);
  }

  return { whereClause, queryParams };
};


exports.getSalesReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

 try {
    const { whereClause, queryParams, authError } = buildReportWhereClause(req);
    if (authError) {
      return res.status(403).json({ message: 'Access Denied: You can only view reports for your assigned branch.' });
    }

    const query = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(COUNT(order_id), 0) as total_orders,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM orders
      WHERE status = 'completed' ${whereClause};
    `;
    
    const { rows } = await db.query(query, queryParams);
    
    // Format the numbers to 2 decimal places for a clean response
    const report = {
      total_sales: parseFloat(rows[0].total_sales).toFixed(2),
      total_orders: parseInt(rows[0].total_orders),
      average_order_value: parseFloat(rows[0].average_order_value).toFixed(2),
    };

    res.status(200).json(report);

  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//top selling
exports.getTopSellingProductsReport = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { whereClause, queryParams, authError } = buildReportWhereClause(req);
        if (authError) {
            return res.status(403).json({ message: 'Access Denied: You can only view reports for your assigned branch.' });
        }

        const query = `
            SELECT 
                p.product_name,
                p.sku,
                SUM(oi.quantity) as total_units_sold,
                SUM(oi.quantity * oi.unit_price) as total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.status = 'completed' ${whereClause.replace(/branch_id/g, 'o.branch_id').replace(/order_date/g, 'o.order_date')}
            GROUP BY p.product_name, p.sku
            ORDER BY total_units_sold DESC
            LIMIT 10;
        `;

        const { rows } = await db.query(query, queryParams);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error generating top-selling products report:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


//inventory
exports.getInventoryReport = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { branchId } = req.query;
    const { role, branchId: userBranchId } = req.user;

    // User Must specify a branchId, and it must be their own if they are a Branch Officer
    if (!branchId) {
        return res.status(400).json({ message: 'A branchId query parameter is required for this report.' });
    }
    if (role === 'Branch Officer' && branchId !== userBranchId) {
        return res.status(403).json({ message: 'Access Denied: You can only view reports for your assigned branch.' });
    }

    try {
        const query = `
            SELECT p.product_name, p.sku, p.price, i.quantity, i.low_stock_threshold
            FROM inventory i
            JOIN products p ON i.product_id = p.product_id
            WHERE i.branch_id = $1
            ORDER BY p.product_name ASC;
        `;
        const { rows } = await db.query(query, [branchId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error generating inventory report:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//asset report
exports.getAssetReport = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        let query = `
            SELECT a.asset_name, a.serial_number, a.purchase_date, a.purchase_cost, a.current_value, b.branch_name 
            FROM assets a
            JOIN branches b ON a.branch_id = b.branch_id
        `;
        const queryParams = [];

        
        if (req.user.role === 'Branch Officer') {
            query += ' WHERE a.branch_id = $1';
            queryParams.push(req.user.branchId);
        } else if (req.query.branchId) { // Admins can optionally filter
             query += ' WHERE a.branch_id = $1';
            queryParams.push(req.query.branchId);
        }

        query += ' ORDER BY b.branch_name, a.asset_name ASC';
        
        const { rows } = await db.query(query, queryParams);
        res.status(200).json(rows);
        
    } catch (error) {
        console.error('Error generating asset report:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}