
const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const {body, param} = require('express-validator');

//validation middleware for user creation
const validateUserCreation = [
    body('username').isString().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({min:8}).withMessage('Password must be at least 8 characters long'),
    body('role_id').isUUID().withMessage('Valid role ID(UUID) is required'),
    body('branch_id').optional({checkFalsy: true}).isUUID().withMessage('branch id must be a valid UUID')
];

const validateUserUpdate = [
  param('userId').isUUID().withMessage('User ID must be a valid UUID.'),
  body('username').optional().isString().notEmpty().withMessage('Username must be a non-empty string.'),
  body('email').optional().isEmail().withMessage('A valid email address is required.'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('role_id').optional().isUUID().withMessage('role_id must be a valid UUID.'),
  body('branch_id').optional({ checkFalsy: true }).isUUID().withMessage('branch_id must be a valid UUID.'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean (true or false).')
];

router.use(authenticateToken);
router.use(authorizeRole('Admin'));

router.get('/', userController.getAllUsers);
router.post('/', validateUserCreation, userController.createUser);
router.get('/:userId', param('userId').isUUID().withMessage('Valid user ID(UUID) is required'), userController.getUserById);
router.put('/:userId', validateUserUpdate, userController.updateUser);
router.delete('/:userId', param('userId').isUUID().withMessage('Valid user ID(UUID) is required'), userController.deactivateUser);

module.exports = router;
