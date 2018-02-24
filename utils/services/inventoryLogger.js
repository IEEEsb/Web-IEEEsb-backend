const config = require('../services.js').config,
Promise = require('bluebird'),
winston = require('winston'),
mongoose = require('mongoose'),
Log = mongoose.model('LogModel'),
Item = mongoose.model('ItemModel'),
User = mongoose.model('UserModel');

exports.logBuy = function (user, item, quantity) {

	Promise.all([User.findById(user, "_id alias money").exec(), Item.findById(item, "_id name code buyPrice sellPrice").exec()]).then(values => {
		let log = new Log({
			action: "buy",
			who: values[0],
			item: values[1],
			quantity: quantity,
			options: {
				cancelled: false
			}
		});

		log.save().then(() => {

		});
	});
}

exports.logCancel = function (user, purchase) {

	User.findById(user, "_id alias money").then(values => {


		let log = new Log({
			action: "cancel",
			who: values[0],
			options: {purchase: purchase}
		});

		log.save().then(() => {

		});
	});
}

exports.logInsert = function (user, item) {

	Promise.all([User.findById(user, "_id alias"), Item.findById(item)]).then(values => {
		let log = new Log({
			action: "insert",
			who: values[0],
			item: values[1]
		});

		log.save().then(() => {

		});
	});



}

exports.logUpdate = function (user, item, reset) {

	Promise.all([User.findById(user, "_id alias"), Item.findById(item)]).then(values => {
		let log = new Log({
			action: "update",
			who: values[0],
			item: values[1],
			options: {reset: reset}
		});

		log.save().then(() => {

		});
	});



}

exports.logRegister = function (who) {

	User.findById(who).then(values => {
		let log = new Log({
			action: "register",
			who: values[0]
		});

		log.save().then(() => {

		});
	});



}

exports.logAddMoney = function (user, toUser, quantity) {
	Promise.all([User.findById(user, "_id alias"), User.findById(toUser, "_id alias name ieee money")]).then(values => {
		let log = new Log({
			action: "money",
			who: values[0],
			to: values[1],
			quantity: quantity
		});

		log.save().then(() => {

		});
	});



}

exports.init = function() {
	return new Promise((resolve) => {
		return resolve();
	});
}