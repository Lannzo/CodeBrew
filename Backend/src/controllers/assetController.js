const db = require('../config/db');
const { validationResult } = require('express-validator');

//get all assets
exports.getAllAssets = async (req, res) => {
  try {
    let query = `
      SELECT a.*, b.branch_name 
      FROM assets a
      JOIN branches b ON a.branch_id = b.branch_id
    `;
    const queryParams = [];

    // Allow filtering by branchId
    if (req.query.branchId) {
      query += ' WHERE a.branch_id = $1';
      queryParams.push(req.query.branchId);
    }
    
    // Branch Officers can only see assets for their assigned branch
    if (req.user.role === 'Branch Officer') {
      if (req.query.branchId && req.query.branchId !== req.user.branchId) {
        return res.status(403).json({ message: 'Access Denied: You can only view assets for your assigned branch.' });
      }
      query += queryParams.length > 0 ? ' AND' : ' WHERE';
      query += ` a.branch_id = $${queryParams.length + 1}`;
      queryParams.push(req.user.branchId);
    }

    query += ' ORDER BY a.asset_name ASC';

    const { rows } = await db.query(query, queryParams);
    res.status(200).json(rows);

  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//get 1 asset by ID
exports.getAssetById = async (req, res) => {

   const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { assetId } = req.params;

    // Fetch asset details
    const assetResult = await db.query('SELECT * FROM assets WHERE asset_id = $1', [assetId]);
    if (assetResult.rows.length === 0) {
      return res.status(404).json({ message: 'Asset not found.' });
    }
    const asset = assetResult.rows[0];

    // Authorization check: Admins can see anything, Branch Officers only their own.
    if (req.user.role === 'Branch Officer' && asset.branch_id !== req.user.branchId) {
      return res.status(403).json({ message: 'Access Denied: You cannot view this asset.' });
    }

    // Fetch maintenance history for this asset
    const maintenanceResult = await db.query('SELECT * FROM maintenance_logs WHERE asset_id = $1 ORDER BY service_date DESC', [assetId]);
    
    // Combine the results into a single response object
    const detailedAsset = {
      ...asset,
      maintenance_history: maintenanceResult.rows
    };

    res.status(200).json(detailedAsset);

  } catch (error) {
     console.error('Error fetching asset by ID:', error);
     res.status(500).json({ message: 'Internal server error' });
  }
};

//create asset
exports.createAsset = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { asset_name, branch_id, purchase_date, purchase_cost, serial_number, current_value } = req.body;
    try {
        const query = `
        INSERT INTO assets (asset_name, branch_id, purchase_date, purchase_cost, serial_number, current_value)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const { rows } = await db.query(query, [asset_name, branch_id, purchase_date, purchase_cost, serial_number, current_value]);
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique violation on serial_number
            return res.status(409).json({ message: 'Conflict: An asset with this serial number already exists.'});
        }
        console.error('Error creating asset:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//update asset
exports.updateAsset = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { assetId } = req.params;
  const { asset_name, branch_id, purchase_date, purchase_cost, serial_number, current_value } = req.body;
  
  try {
    const query = `
      UPDATE assets 
      SET asset_name = $1, branch_id = $2, purchase_date = $3, purchase_cost = $4, serial_number = $5, current_value = $6
      WHERE asset_id = $7
      RETURNING *;
    `;
    const { rows } = await db.query(query, [asset_name, branch_id, purchase_date, purchase_cost, serial_number, current_value, assetId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Asset not found.' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') {
        return res.status(409).json({ message: 'Conflict: An asset with this serial number already exists.'});
    }
    console.error('Error updating asset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//delete asset
exports.deleteAsset = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { assetId } = req.params;
    const result = await db.query('DELETE FROM assets WHERE asset_id = $1', [assetId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Asset not found.' });
    }

    res.status(204).send(); 
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//add maintenance log
exports.addMaintenanceLog = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { assetId } = req.params;
  const { service_date, service_details, cost, serviced_by, next_service_due_date } = req.body;
  
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Verify the asset exists and get its branch_id for authorization
    const assetResult = await client.query('SELECT branch_id FROM assets WHERE asset_id = $1', [assetId]);
    if (assetResult.rows.length === 0) {
      throw new Error('Asset not found.');
    }
    const assetBranchId = assetResult.rows[0].branch_id;

    if (req.user.role === 'Branch Officer' && assetBranchId !== req.user.branchId) {
      throw new Error('Access Denied: You cannot add maintenance logs for assets in other branches.');
    }

    //  Insert the new maintenance log
    const logQuery = `
      INSERT INTO maintenance_logs (asset_id, service_date, service_details, cost, serviced_by, next_service_due_date)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const { rows } = await client.query(logQuery, [assetId, service_date, service_details, cost, serviced_by, next_service_due_date]);

    await client.query('COMMIT');
    res.status(201).json(rows[0]);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding maintenance log:', error);
    if (error.message.startsWith('Access Denied') || error.message.startsWith('Asset not found')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};