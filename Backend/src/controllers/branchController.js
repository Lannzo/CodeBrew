
const db = require('../config/db');
const { validationResult} = require('express-validator');

//get all branches Endpoint
exports.getAllBranches = async (req, res) => {
    try {
        const {rows} = await db.query('SELECT * FROM branches ORDER BY branch_name ASC');
        res.status(200).json(rows);
    }catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//get 1 branch endpoint
exports.getBranchById = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try{
        const{ branchId } = req.params;
        const{rows} = await db.query('SELECT * FROM branches WHERE branch_id = $1', [branchId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        res.status(200).json(rows[0]);


    }catch(error) {
        console.error('Error fetching branch:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//create branch endpoint
exports.createBranch = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {branch_name, location_address, contact_details }= req.body;
    try{
        const query = `
            INSERT INTO branches (branch_name, location_address, contact_details)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const{rows} = await db.query(query, [branch_name, location_address, contact_details]);
        res.status(201).json(rows[0]);

    }catch(error){
        console.error('Error creating branch:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//update branch
exports.updateBranch = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try{
        const {branchId} = req.params;
        const{branch_name, location_address, contact_details, is_active} = req.body;

        const{rows} = await db.query(
            `UPDATE branches
             SET branch_name = $1, location_address = $2, contact_details = $3, is_active = $4
             WHERE branch_id = $5
             RETURNING *;
            `,
            [branch_name, location_address, contact_details, is_active, branchId]
        );

        if (rows.length ===0 ) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        res.status(200).json(rows[0]);
    } catch(error){
        console.error('Error updating branch:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


//DEACTIVATE Branch
exports.deactivateBranch = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try{
        const {branchId} = req.params;
        const result = await db.query(
            "UPDATE branches SET is_active = FALSE WHERE branch_id = $1 RETURNING *;",
            [branchId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        
        res.status(200).json({ message: 'Branch deactivated successfully', branch: result.rows[0] });
    } catch (error) {
        console.error('Error deactivating branch:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};





