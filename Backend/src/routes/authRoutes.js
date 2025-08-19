
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

//POST/api/v1/auth/login
router.post('/login', authController.login);

//routes for logout and refresh token

module.exports = router;