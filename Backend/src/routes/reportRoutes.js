const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, blockCashier } = require('../middleware/authMiddleware');
const { query } = require('express-validator');


const validateReportFilters = [
  query('startDate').optional().isISO8601().toDate().withMessage('startDate must be a valid date in YYYY-MM-DD format.'),
  query('endDate').optional().isISO8601().toDate().withMessage('endDate must be a valid date in YYYY-MM-DD format.'),
  query('branchId').optional().isUUID().withMessage('branchId must be a valid UUID.'),
];

router.use(authenticateToken, blockCashier);


router.get('/sales', validateReportFilters, reportController.getSalesReport);

router.get('/top-selling', validateReportFilters, reportController.getTopSellingProductsReport);


router.get('/inventory',[query('branchId').isUUID().withMessage('A valid branchId query parameter is required.')],reportController.getInventoryReport);


router.get('/assets',[ query('branchId').optional().isUUID().withMessage('branchId must be a valid UUID.')],reportController.getAssetReport);

module.exports = router;

