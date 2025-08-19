
const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const {body} = require('express-validator');

//validation middleware for user creation
const validateUserCreation = [
    body('username').isString().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({min:8}).withMessage('Password must be at least 8 characters long'),
    body('role_id').isUUID().withMessage('Valid role ID(UUID) is required'),
    body('branch_id').optional({checkFalsy: true}).isUUID().withMessage('branch id must be a valid UUID')
];

router.use(authenticateToken);
router.use(authorizeRole('Admin'));

router.get('/', userController.getAllUsers);
router.post('/', validateUserCreation, userController.createUser);

module.exports = router;
