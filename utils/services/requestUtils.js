const Promise = require('bluebird'),
winston = require('winston'),
request = require('request');

const servicesLogger = winston.loggers.get('services');

servicesLogger.info("Loading request utils");

// Set the headers

let jar = request.jar();

exports.jar = jar;

let headers = {
	'Content-Type':     'application/json'
}

exports.post = function (url, data, callback) {

	var options = {
		url: url,
		method: 'POST',
		headers: headers,
		jar: jar,
		body: JSON.stringify(data)
	}
	request(options, callback);
}

exports.init = function() {
	return new Promise((resolve) => {
		return resolve();
	});
}