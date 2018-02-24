const services = require("../utils/services.js"),
config = require('../utils/services.js').config,
mongoose = require('mongoose'),
Media = mongoose.model('MediaModel'),
CodedError = require('../utils/CodedError.js'),
Promise = require('bluebird'),
winston = require('winston'),
multer = require('multer'),
fs = require('fs');

const systemLogger = winston.loggers.get("system");
const sessionLogger = winston.loggers.get("session");

const mediaPath = config.uploadedBase + '/media';

exports.getAllMedia = function (req, res, next) {

	Media.find().exec().then((items) => {
		return res.status(200).send(items);
	}).catch((reason) => {
		return next(new CodedError(reason, 400));
	});
}

exports.uploadMedia = function (req, res, next) {

	if (!req.files || req.files.length == 0) return next(new CodedError("No files given", 400));

	let file = req.files[0];
	console.log(file);
	let id = new mongoose.Types.ObjectId;
	let media = new Media({
		_id: id,
		name: file.originalname,
		url: config.fileServer + "/media/" + id + '.' + file.originalname.split(".").pop(),
		createdOn: Date.now(),
		mimeType: file.mimetype
	});

	media.save().then(() =>  {
		services.fileUtils.ensureExists(mediaPath);
	}).then(() => {
		console.log(media);
		return services.fileUtils.moveFile(config.uploadedBase + '/tmp/' + file.filename, mediaPath + '/' + media._id.toString() + '.' + media.name.split(".").pop());
	}).then(() => {
		return res.status(200).send(media);
	}).catch(reason => {
		return next(new CodedError(reason, 400));
	});
};

exports.removeMedia = function (req, res, next) {

	Media.findOneAndRemove({_id: req.params.id}).exec().then(file => {
		return fs.unlink(mediaPath + "/" + file._id + '.' + file.name.split(".").pop());
	}).then(() => {
		res.status(200).send(true);
	}).catch(reason => {
		return next(new CodedError(reason, 400));
	});
}