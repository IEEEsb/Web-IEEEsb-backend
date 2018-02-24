const express = require('express'),
authController = require('../controllers/authController.js'),
mediaController = require('../controllers/mediaController.js'),
multer = require('multer'),
upload = multer({ dest: './uploaded/tmp' });

let router = express.Router();

router.route('/').get(mediaController.getAllMedia);

router.use(authController.auth);
router.use(authController.authRole('ieee'));

router.route('/').post(upload.any(), mediaController.uploadMedia);

router.use(authController.authRole('admin'));

router.route('/remove/:id').post(mediaController.removeMedia);




module.exports = router;