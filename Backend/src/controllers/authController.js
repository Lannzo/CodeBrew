
const db = require('../config/db'); // Import the database config
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//login function
exports.login = async (req, res) => {
    const { username, password } = req.body;

    //basic validation
    if(!username || !password ){
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        //find the user in the database
        const userQuery = `
            SELECT u.user_id, u.username, u.password_hash, r.role_name
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.username = $1 AND u.is_active = TRUE;
        `;
        const userResult = await db.query(userQuery, [username]);

        // Check if user exists
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = userResult.rows[0];

        // compare the password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if(!isPasswordValid) {
            return res.status(401).json({ message: 'Wrong Password' });
        }

        //create a JWT
        const accessTokenPayload = {
            userId: user.user_id,
            role: user.role_name,
        };

        //refresh token payload
        const refreshTokenPayload = {
            userId: user.user_id,
        };

        const accessToken = jwt.sign(accessTokenPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(refreshTokenPayload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

        //send the tokens
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ accessToken });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }


}