
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./config/db'); // Import the database configuration

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;

//middleware
app.use(cors());
// Parse JSON bodies
app.use(express.json());

db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database Connection Error:', err.stack);
    } else {
        console.log('Database Connection Successful. Current Time:', res.rows[0]);
    }
});

//Routes
app.get('/api/v1', (req, res) => {
    res.json({ message: 'Welcome to coffee and bread shop API!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});