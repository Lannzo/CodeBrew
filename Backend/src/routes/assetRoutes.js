const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticateToken, authorizeRole, blockCashier} = require('../middleware/authMiddleware');
const { body, param, query } = require('express-validator');

const validateAssetCreation = [
  body('asset_name').notEmpty().withMessage('Asset name is required.'),
  body('branch_id').isUUID().withMessage('A valid branchId is required.'),
  body('purchase_date').optional().isISO8601().toDate().withMessage('Purchase date must be a valid date.'),
  body('purchase_cost').optional().isDecimal().withMessage('Purchase cost must be a valid decimal number.'),
  body('current_value').optional({ nullable: true }).isDecimal().withMessage('Current value must be a valid decimal number.'),
];

const validateParamAssetId = [
  param('assetId').isUUID().withMessage('Asset ID must be a valid UUID.'),
];

const validateMaintenanceLogBody = [
  body('service_date').isISO8601().toDate().withMessage('Service date is required and must be a valid date (YYYY-MM-DD).'),
  body('service_details').notEmpty().withMessage('Service details are required.'),
  body('cost').optional({ nullable: true }).isDecimal().withMessage('Cost must be a valid decimal number.'),
  body('next_service_due_date').optional({ nullable: true }).isISO8601().toDate().withMessage('Next service due date must be a valid date (YYYY-MM-DD).'),
];

router.use(authenticateToken, blockCashier);

router.get('/', assetController.getAllAssets);
router.get('/:assetId', validateParamAssetId, assetController.getAssetById);

router.post('/', authorizeRole('Admin'), validateAssetCreation, assetController.createAsset);
router.put('/:assetId', authorizeRole('Admin'), validateParamAssetId, validateAssetCreation, assetController.updateAsset);

router.delete('/:assetId', authorizeRole('Admin'), validateParamAssetId, assetController.deleteAsset);

//maintenance
router.post('/:assetId/maintenance', validateParamAssetId, validateMaintenanceLogBody, assetController.addMaintenanceLog);

module.exports = router;
