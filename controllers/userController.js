const services = require("../utils/services.js"),
    config = services.config,
    mongoose = require('mongoose'),
    User = mongoose.model('UserModel'),
    CodedError = require('../utils/CodedError.js'),
    mapBasicUser = require('./userAccountController.js').mapBasicUser,
    winston = require('winston');

const systemLogger = winston.loggers.get('system');


exports.getCurrentUser = function (req, res, next) {
	User.findById(req.session.user._id, { _id: 1, alias: 1, name: 1, email: 1, ieee: 1, code: 1, money: 1, roles: 1, profilePic: 1 }).exec().then((user) => {
		if (req.session.user._id == user._id) {
			req.session._garbage = new Date();
			req.session.touch();
		}
		return res.status(200).jsonp(mapBasicUser(user));
	}).catch(reason => {
		return next(new CodedError(reason, 500));
	});

}

exports.getUser = function (req, res, next) {
    User.findById(req.params.user, { _id: 1, alias: 1, name: 1, email: 1, ieee: 1, code: 1, money: 1, roles: 1, profilePic: 1 }).exec().then(user => {
        if (req.session.user._id == user._id) {
            req.session._garbage = new Date();
            req.session.touch();
        }
        return res.status(200).jsonp(mapBasicUser(user));
    }).catch(reason => {
        return next(new CodedError(reason, 500));
    });
}

exports.getUsers = function (req, res, next) {
    User.find({}, { _id: 1, alias: 1, name: 1, email: 1, ieee: 1, code: 1, money: 1, roles: 1, profilePic: 1 }).exec().then(users => {
        users = users.map(mapBasicUser);
        return res.status(200).jsonp(users);
    }).catch(reason => {
        return next(new CodedError(reason, 500));
    });
}