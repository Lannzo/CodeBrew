
const db = require('../config/db'); // Import the database config

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