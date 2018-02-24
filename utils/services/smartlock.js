const Promise = require('bluebird'),
winston = require('winston'),
mongoose = require('mongoose'),
User = mongoose.model('UserModel'),
request = require('request'),
authController = require('../../controllers/authController.js'),
services = require("../services.js"),
CodedError = require('../CodedError.js'),
config = services.config,
requestUtils = services.requestUtils;

const servicesLogger = winston.loggers.get('services');

servicesLogger.info("Loading smartlock");

let url = config.smartlockUrl;
let apiUrl = url + 'smartlock/api/';

let user = {};
let jar = requestUtils.jar;

exports.registerUser = function (user) {
	return new Promise((resolve, reject) => {
		Promise.all([User.findById(user,  "alias name email").exec(), authController.SHA256('PedroComePiedras'), requireAuth()])
		.then((values) => {
			let data = values[0]._doc;
			data.password = values[1];
			data.active = true;
			requestUtils.post(apiUrl + 'users/newuser', data, (error, response, body) => {
				if (!error && response.statusCode == 200) {
					return resolve();
				} else if (!error && response.statusCode != 200) {
					return reject(new CodedError("Invalid values", 404));
				} else if (error) {
					return reject(error);
					console.log(error);
				}
			})
		});
	});

}

function requireAuth() {
	return new Promise((resolve) => {

		let auth = false;
		for (let cookie of jar.getCookies(url)) {
			if(cookie.key === "IEEEsb"){
				auth = true;
				break;
			}
		}
		if(auth){
			return resolve();
		} else {
			authController.SHA256(config.smartlockPass).then( (pass) => {
				let data = {
					alias: config.smartlockAlias,
					password: pass
				}

				let jar = requestUtils.jar;
				requestUtils.post(apiUrl + 'admins/adminlogin', data, (error, response, body) => {
					if (!error && response.statusCode == 200) {
						user = body;
					} else if (error) {
						console.log(error);
					}
				})

				return resolve();
			});
		}

	});
}

exports.init = function() {
	return requireAuth();
}