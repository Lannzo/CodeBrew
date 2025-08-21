const express = require('express');
const router = express.Router();
const inventoryController =  require('../controllers/inventoryController');

const {authenticateToken, blockCashier} = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');

const validateGetInventory = [
    param('branchId').isUUID().withMessage('Invalid branch ID format'),
];

const validateAdjustment =[
    body('productId').isUUID().withMessage('Invalid product ID format'),
    body('branchId').isUUID().withMessage('Invalid branch ID format'),
    body('changeQuantity').isInt().withMessage('Invalid change quantity'),
    body('reason').trim().notEmpty().withMessage('Reason is required')
];

const validateTransfer = [
    body('productId').isUUID().withMessage('Invalid product ID format'),
    body('fromBranchId').isUUID().withMessage('Invalid from branch ID format'),
    body('toBranchId').isUUID().withMessage('Invalid to branch ID format'),
    body('quantity').isInt({ gt: 0 }).withMessage('Invalid transfer quantity'),
];

const validateBranchId = [
    param('branchId').isUUID().withMessage('Invalid branch ID format'),
];

router.use(authenticateToken, blockCashier);

router.get('/:branchId', validateGetInventory, inventoryController.getInventoryByBranch);

router.get('/alerts/:branchId', validateBranchId, inventoryController.getLowStockAlerts);

router.post('/adjust', validateAdjustment, inventoryController.adjustInventory);

router.post('/transfer', validateTransfer, inventoryController.transferProducts);

module.exports = router;