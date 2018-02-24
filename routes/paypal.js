const express = require('express'),
authController = require('../controllers/authController.js'),
paypalController = require('../controllers/paypalController.js');

let router = express.Router();

router.use(authController.auth);
router.use(authController.authRole('ieee'));

router.route('/createpayment/:amount').post(paypalController.createPayment);
router.route('/executepayment').post(paypalController.executePayment);

module.exports = router;