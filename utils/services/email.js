var Promise = require('bluebird'),
services = require('../services.js'),
config = services.config,
winston = require('winston'),
nodemailer = require('nodemailer');

const servicesLogger = winston.loggers.get('services');

servicesLogger.info("Loading email services");

let transporter = nodemailer.createTransport({
	host: config.email.host,
	port: config.email.port,
	secure: config.email.secure,
	auth: {
		user: config.email.user,
		pass: config.email.pass
	}
});

exports.sendRecoverPasswordEmail = function (user, password) {
	return new Promise((resolve, reject) => {

		var data = {
			from: 'IEEEsb Madrid <info@ieeesb.es>',
			to: user.email,
			subject: 'Password recovery',
			html: '<p style="font-size: 12px; margin-left: 20px; line-height: 60%;">' + password + "</p>"
		};
		
		// send mail with defined transport object
		transporter.sendMail(data, (error, info) => {
			console.log(info);
			if (error) return reject(error);
			else return resolve(info);
		});
	});
}

exports.init = function () {
	return new Promise((resolve, reject) => {
		return resolve();
	});
};
