
const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');

const {
    authenticateToken,
    authorizeAdminOrBranchOfficerForBranch,
    authorizeRole
} = require('../middleware/authMiddleware');

const {body, param} = require('express-validator');

const validateBranchCreation = [
    body('branch_name').notEmpty().withMessage('Branch name is required.'),
    body('location_address').notEmpty().withMessage('Branch location is required.'),
    body('contact_details').notEmpty().withMessage('Branch contact is required.')
];

const validateBranchUpdate = [
    body('branch_name').notEmpty().withMessage('Branch name is required.'),
    body('location_address').notEmpty().withMessage('Branch location is required.'),
    body('contact_details').notEmpty().withMessage('Branch contact is required.'),
    body('is_active').isBoolean().withMessage('Branch status is required and must be a true or false value.')
];

const validateParamId = [
    param('branchId').isUUID().withMessage('Branch ID must be a valid UUID.')
];  

router.use(authenticateToken);

router.get('/', authorizeRole('Admin'), branchController.getAllBranches);
router.get('/:branchId', validateParamId, authorizeAdminOrBranchOfficerForBranch, branchController.getBranchById);

router.post('/', authorizeRole('Admin'), validateBranchCreation, branchController.createBranch);

router.put('/:branchId', validateParamId, authorizeAdminOrBranchOfficerForBranch, validateBranchUpdate, branchController.updateBranch);

router.delete('/:branchId', validateParamId, authorizeRole('Admin'), branchController.deactivateBranch);

module.exports = router;
