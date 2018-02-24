const services = require("../utils/services.js"),
config = services.config,
logger = services.inventoryLogger,
paypal = require('paypal-rest-sdk'),
mongoose = require('mongoose'),
User = mongoose.model('UserModel'),
CodedError = require('../utils/CodedError.js'),
winston = require('winston');

const systemLogger = winston.loggers.get('system');

exports.createPayment = function (req, res, next) {
	let payment = {
		"intent": "sale",
		"payer": {
			"payment_method": "paypal"
		},
		"redirect_urls": {
			"return_url": "http://ieeesb.es",
			"cancel_url": "http://ieeesb.es"
		},
		"transactions": [{
			"amount": {
				"currency": "EUR",
				"total": req.params.amount
			},
			"description": "Nevera Cubo"
		}]
	};
	paypal.payment.create(payment, function (error, payment) {
		if (error) {
			console.log(error.response);
			return next(new CodedError(error, 500));
		}
		return res.status(200).jsonp({id: payment.id});
	});

}

exports.executePayment = function (req, res, next) {
	paypal.payment.execute(req.body.paymentID, {payer_id: req.body.payerID}, function (error, payment) {
		if (error) {
			console.log(error.response);
			return next(new CodedError(error, 500));
		}
		if (payment.state !== "approved") {
			return next(new CodedError(payment.failure_reason, 400));
		}


		console.log(payment);
		let money = parseFloat(payment.transactions[0].amount.total);
		let fee = 0.034;
		let fix = 0.35;
		money =  Math.round(money * (1 - fee) - fix);
		let user = req.session.user;

		User.update({ _id: user }, { $inc: { money: money } }).exec().then(() => {
			logger.logAddMoney(user._id, user, money);
			return res.status(200).send(true);
		}).catch(reason => {
			return next(new CodedError(reason, 400));
		});
	});
}