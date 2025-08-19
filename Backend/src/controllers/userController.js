
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
