const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const { body, param, query } = require('express-validator');


router.use(authenticateToken);


//admin only
router.get('/settings', settingsController.getAllSettings);
router.put('/settings', settingsController.updateSettings);


//payment methods
router.get(
    '/payment-methods',
    // Admins can optionally filter by branch
    query('branchId').optional().isUUID().withMessage('branchId must be a valid UUID.'),
    settingsController.getAllPaymentMethods
);

// POST and PUT are Admin-only.
router.post(
    '/payment-methods',
    authorizeRole('Admin'),
    body('method_name').trim().notEmpty().withMessage('Method name is required.'),
    settingsController.createPaymentMethod
);

router.put(
    '/payment-methods/:id',
    authorizeRole('Admin'),
    param('id').isUUID().withMessage('A valid payment method ID is required.'),
    body('method_name').trim().notEmpty().withMessage('Method name is required.'),
    body('is_active').isBoolean().withMessage('is_active must be true or false.'),
    settingsController.updatePaymentMethod
);


//discounts
router.get(
    '/discounts',
    // Admins can optionally filter by branch
    query('branchId').optional().isUUID().withMessage('branchId must be a valid UUID.'),
    settingsController.getAllDiscounts
);

// POST and PUT are Admin-only.
router.post(
    '/discounts',
    authorizeRole('Admin'),
    body('discount_name').trim().notEmpty().withMessage('Discount name is required.'),
    body('discount_type').isIn(['percentage', 'fixed_amount']).withMessage("Discount type must be 'percentage' or 'fixed_amount'."),
    body('discount_value').isDecimal().withMessage('Discount value must be a valid number.'),
    body('start_date').optional({ nullable: true }).isISO8601().toDate().withMessage('Start date must be a valid date.'),
    body('end_date').optional({ nullable: true }).isISO8601().toDate().withMessage('End date must be a valid date.'),
    settingsController.createDiscount
);

router.put(
    '/discounts/:id',
    authorizeRole('Admin'),
    param('id').isUUID().withMessage('A valid discount ID is required.'),
    body('discount_name').trim().notEmpty().withMessage('Discount name is required.'),
    body('discount_type').isIn(['percentage', 'fixed_amount']).withMessage("Discount type must be 'percentage' or 'fixed_amount'."),
    body('discount_value').isDecimal().withMessage('Discount value must be a valid number.'),
    body('is_active').isBoolean().withMessage('is_active must be true or false.'),
    body('start_date').optional({ nullable: true }).isISO8601().toDate().withMessage('Start date must be a valid date.'),
    body('end_date').optional({ nullable: true }).isISO8601().toDate().withMessage('End date must be a valid date.'),
    settingsController.updateDiscount
);

module.exports = router;