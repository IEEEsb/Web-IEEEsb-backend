const services = require("../utils/services.js"),
config = services.config,
logger = services.inventoryLogger,
smartlock = services.smartlock,
mongoose = require('mongoose'),
User = mongoose.model('UserModel'),
authController = require('./authController.js'),
moment = require('moment'),
CodedError = require('../utils/CodedError.js'),
slug = require('slug'),
winston = require('winston');

const systemLogger = winston.loggers.get('system');

const storagePath = config.uploadedBase + '/users';
const baseFilesURL = config.fileServer + '/files/users/';

function mapBasicUser(user) {
	return {
		_id: user._id,
		alias: user.alias,
		roles: user.roles,
		name: user.name,
		email: user.email,
		money: user.money,
		ieee: user.ieee,
		code: user.code,
		profilePic: baseFilesURL + user.slug + '/' + (user.profilePic || 'default.png'),
	}
}

exports.mapBasicUser = mapBasicUser;

exports.addMoney = function (req, res, next) {
	let money = parseFloat(req.body.money);
	let user = req.body.user;
	if(isNaN(money)) return next(new CodedError("Not a number", 403));

	User.update({ _id: user }, { $inc: { money: money } }).exec().then(() => {
		logger.logAddMoney(req.session.user._id, user, money);
		return res.status(200).send(true);
	}).catch(reason => {
		return next(new CodedError(reason, 400));
	});
};
exports.regUser = function (req, res, next) {
	var alias = req.body.alias ? req.body.alias : null;
	if (!alias || alias == "") return next(new CodedError("Invalid alias", 400));

	var name = req.body.name ? req.body.name : null;
	if (!name || name == "") return next(new CodedError("Invalid name", 400));

	var email = req.body.email ? req.body.email.trim() : null;
	if (!email || email == "" || email.indexOf(" ") != -1 || email.indexOf("@") == -1) return next(new CodedError("Invalid email", 400));

	var user;
	var image = req.files && req.files.image ? req.files.image[0] : null;
	var ieee = req.body.ieee && req.body.ieee != "" ? req.body.ieee : "";
	authController.generateSaltedPassword(req.body.password.toLowerCase(), config.pwdIterations).then((saltedPassword) => {
		user = new User({
			alias: req.body.alias.toLowerCase(),
			slug: slug(req.body.alias.toLowerCase()),
			profilePic: image ? image.filename : undefined,
			email: email,
			name: name,
			pwd: saltedPassword,
			hasPassword: true,
			roles: ['user']
		});

		if(ieee !== ""){
			user.ieee = ieee;
			user.code = ieee;
		}
		var tasks = [];
		if (image) {
			tasks.push(services.fileUtils.ensureExists(storagePath + '/' + user.slug).then(() => {
				return services.fileUtils.moveFile(config.uploadedBase + '/' + image.filename, storagePath + '/' + user.slug + '/' + image.filename);
			}));
		}
		tasks.push(User.create(user));
		return Promise.all(tasks);
	}).then(() => {
		var userToSend = mapBasicUser(user);
		//req.session.user = userToSend;
		logger.logRegister(req.session.user._id, user._id);
		return res.status(200).send(userToSend);
	}).catch((reason) => {
		return next(new CodedError(reason, 400));
	});
};

exports.login = function (req, res, next) {
	let user;
	let search = {};
	if(req.body.code){
		User.findOne({ code: req.body.code }).then((storedUser) => {
			user = storedUser;
			if (!user) throw new CodedError("Code not found", 400);
			var userToSend = mapBasicUser(user);
			req.session.user = userToSend;
			return res.status(200).jsonp(userToSend);
		}).catch((reason) => {
			return next(new CodedError(reason, 400));
		});
	} else {
		User.findOne({ alias: req.body.alias.toLowerCase() }).then((storedUser) => {
			user = storedUser;
			if (!user) throw new CodedError("Alias not found", 400);
			return authController.validateSaltedPassword(req.body.password, user.pwd.salt, user.pwd.hash, user.pwd.iterations);
		}).then((result) => {
			if (!result) throw new CodedError("Incorrect password", 400);
			var userToSend = mapBasicUser(user);
			req.session.user = userToSend;
			return res.status(200).jsonp(userToSend);
		}).catch((reason) => {
			return next(new CodedError(reason, 400));
		});
	}

};

exports.logout = function (req, res, next) {

	req.session.destroy(err => {
		if(err) next(new CodedError(err, 400));
		return res.status(200).send(true);
	});

};

exports.toIEEE = function (req, res, next) {
	User.update({_id: req.params.id}, {$push: {roles: 'ieee'}}).then(() => {
		return smartlock.registerUser(req.params.id)
	}).then(() => {
		res.status(200).send(true);
	}).catch(reason => {
		return next(new CodedError(reason, 400));
	});

};

exports.updateProfile = function (req, res, next) {
	if((req.body.alias != req.session.user.alias) && (!req.session.user.roles.includes('admin'))) return next(new CodedError("Not authorized", 403));
	User.findOne({ alias: req.body.alias.toLowerCase() }).then((storedUser) => {
		user = storedUser;
		user.name = req.body.name;
		user.email = req.body.email;
		user.ieee = req.body.ieee;
		user.code = req.body.code;
		if (!user.name || user.name == "") user.name = user.alias;
		return user.save();
	}).then(() => {
		return res.status(200).send(user);
	}).catch(reason => {
		return next(new CodedError(reason, 400));
	});
};

exports.changePassword = function (req, res, next) {
	var user;
	console.log(req.body);
	User.findOne({ alias: req.body.alias }).exec().then((result) => {
		user = result;
		console.log(user.pwd);
		if (!req.body.oldPassword) throw new CodedError("No old password", 403);
		return authController.validateSaltedPassword(req.body.oldPassword, user.pwd.salt, user.pwd.hash, user.pwd.iterations);
	}).then((result) => {
		if (!result) throw new CodedError("Bad old password", 403);
		if (!req.body.password || req.body.password == "") throw new CodedError("Bad new password", 400);
		return authController.generateSaltedPassword(req.body.password, config.pwdIterations);
	}).then((saltedPassword) => {
		user.pwd = saltedPassword;
		return user.save();
	}).then(() => {
		return res.status(200).send("Password updated");
	}).catch((err) => {
		return next(err);
	});
};

exports.restoreUserPassword = function (req, res, next) {
	var user;
	var newPassword;
	User.findOne({ alias: req.body.alias.toLowerCase() }).exec().then((storedUser) => {
		user = storedUser;
		if (!user) throw new CodedError("Not found", 404);
		if (user.email != req.body.email) throw new CodedError("Not valid email", 400);
		newPassword = authController.generateRandomPassword();
		return authController.SHA256(newPassword);
	}).then((hash) => {
		return authController.generateSaltedPassword(hash, config.pwdIterations);
	}).then((saltedPassword) => {
		user.pwd = saltedPassword;
		return user.save();
	}).then(() => {
		return services.email.sendRecoverPasswordEmail(user, newPassword);
	}).then((info) => {
		systemLogger.info("Message sent: " + info.response);
		return res.status(200).send("Success");
	}).catch((err) => {
		return next(err);
	});
};