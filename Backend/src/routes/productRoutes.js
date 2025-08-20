const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');

//  Validation Rules
const validateProduct = [
  body('product_name').notEmpty().withMessage('Product name is required.'),
  body('sku').notEmpty().withMessage('SKU is required.'),
  body('price').isDecimal({ decimal_digits: '1,2' }).withMessage('Price must be a valid decimal.'),
];

const validateParamId = [
  param('productId').isUUID().withMessage('Product ID must be a valid UUID.'),
];


router.use(authenticateToken);


router.get('/', productController.getAllProducts);
router.get('/:productId', validateParamId, productController.getProductById);

// WRITE routes are ADMIN-ONLY
router.post(
  '/',
  authorizeRole('Admin'),
  validateProduct,
  productController.createProduct
);

router.put(
  '/:productId',
  authorizeRole('Admin'),
  validateParamId,
  validateProduct, 
  body('is_active').isBoolean().withMessage('is_active must be true or false'), 
  productController.updateProduct
);

router.delete(
  '/:productId',
  authorizeRole('Admin'),
  validateParamId,
  productController.deleteProduct
);

module.exports = router;