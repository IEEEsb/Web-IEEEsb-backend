const express = require('express'),
    authController = require('../controllers/authController.js'),
    userController = require('../controllers/userController.js'),
    userAccountController = require('../controllers/userAccountController.js'),
    multer = require('multer'),
    upload = multer({ dest: './uploaded/' });

let router = express.Router();

router.route('/restorepassword').post(userAccountController.restoreUserPassword);
router.route('/register').post(upload.fields([{ name: "image" }]), userAccountController.regUser);
router.route('/login').post(userAccountController.login);
router.route('/logout').post(userAccountController.logout);
router.route('/update').post(upload.fields([{ name: "image" }]), userAccountController.updateProfile);

router.use(authController.auth);

router.route('/').get(userController.getCurrentUser);
router.route('/user/:user').get(userController.getUser);
router.route('/changepassword').post(userAccountController.changePassword);

router.use(authController.authRole('admin'));

router.route('/addmoney').post(userAccountController.addMoney);
router.route('/all').get(userController.getUsers);
router.route('/toieee/:id').post(userAccountController.toIEEE);


module.exports = router;