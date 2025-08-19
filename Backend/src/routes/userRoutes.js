
const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');


router.use(authenticateToken);

router.get('/', authorizeRole('Admin'), userController.getAllUsers);

module.exports = router;
