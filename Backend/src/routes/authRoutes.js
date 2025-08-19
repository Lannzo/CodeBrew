
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

//POST/api/v1/auth/login
router.post('/login', authController.login);

//route for refreshToken
router.post('/refresh-token', authController.refreshToken);

//routes for logout 
router.post('/logout', authController.logout);




module.exports = router;