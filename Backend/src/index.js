
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./config/db'); // Import the database configuration

//import routers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const branchRoutes = require('./routes/branchRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const roleRoutes = require('./routes/roleRoutes');
const assetRoutes = require('./routes/assetRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;

//middleware
app.use(cors());
// Parse JSON bodies
app.use(express.json());
app.use(cookieParser());


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

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/branches', branchRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/config', settingsRoutes);


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});