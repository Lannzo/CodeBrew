
const db = require('../config/db'); // Import the database config
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

//function to get all users
exports.getAllUsers = async (req, res) => {

    try{
        console.log("User making request", req.user);

        const usersQuery = `
            SELECT 
                u.user_id, 
                u.username, 
                u.email, 
                u.first_name, 
                u.last_name, 
                u.is_active, 
                r.role_name
            FROM 
                users u
            JOIN 
                roles r ON u.role_id = r.role_id
            ORDER BY 
                u.created_at DESC;
            `;
        const { rows } = await db.query(usersQuery);

        res.status(200).json(rows);

    }catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

exports.createUser = async (req,res)=>{
    //check for validation errors
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, first_name, last_name, role_id, branch_id} = req.body;

    try {
        //hash
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        //insert new user to db
        const newUserQuery = `
        INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, branch_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING user_id, username, email, created_at;
        `;

        const newUser = await db.query(
            newUserQuery,
            [username, email, passwordHash, first_name, last_name, role_id, branch_id]
        );

        res.status(201).json(newUser.rows[0]);

    } catch(error){
        console.error("Error creating user:", error);
        //handle duplicate username or email
        if(error.code === '23505') {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    //validation errors
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { userId } = req.params; //get user id from the URL param

        const userQuery = `
            SELECT 
            u.user_id, 
            u.username, 
            u.email, 
            u.first_name, 
            u.last_name, 
            u.is_active, 
            r.role_name,
            b.branch_name
        FROM 
            users u
        JOIN 
            roles r ON u.role_id = r.role_id
        LEFT JOIN
            branches b ON u.branch_id = b.branch_id
        WHERE 
            u.user_id = $1;
        `;
    
        const {rows} = await db.query(userQuery, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        //return the user found data
        res.status(200).json(rows[0]);

    } catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    //check for validation errors
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    try{
        const {userId} = req.params;
        const { username, email, first_name, last_name, role_id, branch_id, is_active } = req.body;

        //fetch the existing user
        const existingUser = await db.query('SELECT * FROM users WHERE user_id = $1', [userId]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const fields = [];
        const values = [];
        let queryIndex = 1;
        
        if (username !== undefined) { fields.push(`username = $${queryIndex++}`); values.push(username); }
        if (email !== undefined) { fields.push(`email = $${queryIndex++}`); values.push(email); }
        if (first_name !== undefined) { fields.push(`first_name = $${queryIndex++}`); values.push(first_name); }
        if (last_name !== undefined) { fields.push(`last_name = $${queryIndex++}`); values.push(last_name); }
        if (role_id !== undefined) { fields.push(`role_id = $${queryIndex++}`); values.push(role_id); }
        if (branch_id !== undefined) { fields.push(`branch_id = $${queryIndex++}`); values.push(branch_id); }
        if (is_active !== undefined) { fields.push(`is_active = $${queryIndex++}`); values.push(is_active); }

        //special handling for password

        const newPassword = req.body.password;

        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);
            fields.push(`password_hash = $${queryIndex++}`);
            values.push(passwordHash);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(userId); // Add userId to the end of the values array

        const updateUserQuery = `
            UPDATE users
            SET ${fields.join(", ")}, updated_at = NOW()
            WHERE user_id = $${queryIndex}
            RETURNING user_id, username, email, updated_at;
        `;

        const updatedUser = await db.query(updateUserQuery, values);

        res.status(200).json(updatedUser.rows[0]);

    }catch(error){
        console.error('Error updating users:', error);
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Username or email already exists' });
        }
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

exports.deactivateUser = async (req, res) => {
    //check for validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { userId } = req.params;

        //prevent the admin from deactivating their own account

        if(req.user.user_id === userId) {
            return res.status(403).json({ message: 'You cannot deactivate your own account' });
        }

        //update the users is active to false
        const deactivateUserQuery = `
            UPDATE users
            SET is_active = false, updated_at = NOW()
            WHERE user_id = $1
            RETURNING user_id, username, is_active, updated_at;
        `;
        const result = await db.query(deactivateUserQuery, [userId]);

        // check if the user was found and deactivated
        if(result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deactivated successfully', user: result.rows[0] });

    }catch (error){
        console.error('Error deactivating user:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

