const db = require('../config/db');

exports.getAllRoles = async(req,res) => {
    try {
        const {rows} = await db.query('SELECT * FROM roles ORDER BY role_name ASC');
        res.status(200).json(rows);
    }catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
