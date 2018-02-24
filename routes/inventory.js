const express = require('express'),
    authController = require('../controllers/authController.js'),
    inventoryController = require('../controllers/inventoryController.js'),
    multer = require('multer'),
    upload = multer({ dest: './uploaded/' });

let router = express.Router();

router.route('/loginadmin').post(inventoryController.loginAdmin);

router.use(authController.auth);
router.use(authController.authRole('ieee'));

router.route('/all').get(inventoryController.getItems);
router.route('/buy').post(inventoryController.buyItem);
router.route('/purchases/:id').get(inventoryController.getPurchases);
router.route('/purchases/cancel/:id').post(inventoryController.cancelPurchase);
router.route('/:id').get(inventoryController.getItem);

router.use(authController.authRole('admin'));

router.route('/remove/:id').post(inventoryController.removeItem);
router.route('/insert').post(inventoryController.insertItem);
router.route('/update').post(inventoryController.updateItem);
router.route('/purchases/all').get(inventoryController.getPurchases);

module.exports = router;