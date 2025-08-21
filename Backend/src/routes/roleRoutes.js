const express = require('express');
const router = express.Router();
const roleController = require('../controllers/rolesController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(authorizeRole('Admin'));


router.get('/', roleController.getAllRoles);

module.exports = router;