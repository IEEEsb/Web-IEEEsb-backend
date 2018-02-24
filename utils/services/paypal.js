var Promise = require('bluebird'),
services = require('../services.js'),
config = services.config,
winston = require('winston'),
paypal = require('paypal-rest-sdk');

const servicesLogger = winston.loggers.get('services');

servicesLogger.info("Loading paypal services");

exports.init = function () {
	return new Promise((resolve, reject) => {
		if (config.paypal) {
			paypal.configure({
				'mode': config.paypal.mode, //sandbox or live
				'client_id': config.paypal.client_id,
				'client_secret': config.paypal.client_secret
			});
		}

		return resolve();
	});
};