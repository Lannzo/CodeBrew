
const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { authenticateToken, authorizeRole, authorizeAdminOrBranchOfficerForBranch  } = require('../middleware/authMiddleware');
const {body, param} = require('express-validator');

// Validation for creating an order
const validateOrderCreation = [
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item.'),
    body('items.*.product_id').isUUID().withMessage('Each item must have a valid product_id.'),
    body('items.*.quantity').isInt({ gt: 0 }).withMessage('Item quantity must be a positive integer.'),
    body('payments').isArray({ min: 1 }).withMessage('Order must have at least one payment.'),
    body('payments.*.payment_method_id').isUUID().withMessage('Each payment must have a valid payment_method_id.'),
    body('payments.*.amount_paid').isDecimal({ decimal_digits: '1,2' }).withMessage('Payment amount must be a valid decimal.'),
    body('total_amount').isDecimal({ decimal_digits: '1,2' }).withMessage('Total amount must be a valid decimal.')
];

//middleware for cashiers and officers
const allowCashierOrOfficer = (req, res, next)=> {
    if (req.user.role === 'Cashier' || req.user.role === 'Officer') { //somehow admin is not allowed?
        return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
    
};

router.use(authenticateToken);

router.post('/', allowCashierOrOfficer, validateOrderCreation, posController.createOrder);

router.post('/:orderId/void', authorizeAdminOrBranchOfficerForBranch, param('orderId').isUUID().withMessage('Invalid order ID'), posController.voidOrder);

module.exports = router;
