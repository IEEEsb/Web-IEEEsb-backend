const express = require('express'),
    authController = require('../controllers/authController.js'),
    contentController = require('../controllers/contentController.js'),
    multer = require('multer'),
    upload = multer({ dest: './uploaded/' });

let router = express.Router();

router.route('/all').get(contentController.getPosts);
router.route('/:id').get(contentController.getPost);

router.use(authController.auth);
router.use(authController.authRole('ieee'));

router.route('/').post(contentController.savePost);

router.use(authController.authRole('admin'));

router.route('/remove/:id').post(contentController.removePost);
router.route('/publish/:id').post(contentController.publishPost);


module.exports = router;