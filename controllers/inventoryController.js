const services = require("../utils/services.js"),
config = services.config,
logger = services.inventoryLogger,
mongoose = require('mongoose'),
User = mongoose.model('UserModel'),
Item = mongoose.model('ItemModel'),
Log = mongoose.model('LogModel'),
Session = mongoose.model('SessionModel'),
Lock = require('../utils/lock'),
CodedError = require('../utils/CodedError.js')
authController = require('./authController.js'),
winston = require('winston');

const systemLogger = winston.loggers.get('system');

function mapBasicItem(item) {
	return {
		_id: item.id,
		code: item.code,
		name: item.name,
		location: item.location,
		tags: item.tags,
		goodState: item.goodState,
		type: item.type,
		borrowed: item.borrowed,
		buyPrice: item.buyPrice,
		sellPrice: item.sellPrice,
		quantity: item.quantity,
		icon: item.icon,
		files: item.files
	}
}

function mapBasicPurchase(purchase) {
	return {
		_id: purchase.id,
		who: purchase.who,
		item: purchase.item,
		quantity: purchase.quantity
	}
}

function getBasicItem(item) {

	let formatItem = {};
	for (let key in item) {
		switch (key) {
			case "_id":
			formatItem._id = item._id;
			break;
			case "code":
			formatItem.code = item.code;
			break;
			case "name":
			formatItem.name = item.name;
			break;
			case "location":
			formatItem.location = item.location;
			break;
			case "tags":
			formatItem.tags = item.tags;
			break;
			case "goodState":
			formatItem.goodState = item.goodState;
			break;
			case "type":
			formatItem.type = item.type;
			break;
			case "borrowed":
			formatItem.borrowed = item.borrowed;
			break;
			case "buyPrice":
			formatItem.buyPrice = item.buyPrice;
			break;
			case "sellPrice":
			formatItem.sellPrice = item.sellPrice;
			break;
			case "quantity":
			formatItem.quantity = item.quantity;
			break;
			case "icon":
			formatItem.icon = item.icon;
			break;
			case "files":
			formatItem.files = item.files;
			break;

			default:

		}
	}
	return formatItem;
}

exports.getItems = function (req, res, next) {
	let pageSize = Number(req.query.pagesize);
	let page = Number(req.query.page);

	if ((pageSize || page) && !(pageSize && page)) {  // The pagination parameters are invalid
		return next(new CodedError('If using pagination, both "pagesize" and "page" must be valid', 400));
	}

	// Default values (to avoid working on undefined ones)
	pageSize = pageSize || 0;  // 0 = unlimited
	page = page || 1;  // The first page is #1

	let skip = pageSize * (page - 1);

	Item.find()
	.limit(pageSize)
	.skip(skip)
	.sort('name')
	.exec()
	.then((items) => {
		return res.status(200).send(items);
	}).catch((reason) => {
		return next(reason);
	});
};

exports.getItem = function (req, res, next) {

	Item.findById(req.params.id).exec().then(doc => {
		return res.send(doc);
	}).catch(reason => {
		return next(new CodedError(reason, 500));
	});
};

exports.insertItem = function (req, res, next) {

	let item = getBasicItem(req.body);

	item._id = new mongoose.Types.ObjectId;
	item.icon = req.body.icon && req.body.icon !== "" ? req.body.icon : config.fileServer + "/images/profile_icon.png";

	Item.distinct('code').then(result => {
		let initial = 100000;
		if (req.body.code && req.body.code !== "") {
			item.code = req.body.code;
		} else {
			if (result.length === 0) {
				item.code = initial;
			} else {
				result.sort(function (a, b) {
					return a - b;
				});
				item.code = initial;
				for (var i = 0; i < result.length; i++) {
					if (item.code < result[i]) {
						break;
					}
					if (result[i] + 1 > initial) {
						item.code = result[i] + 1;
					}
				}
			}
		}

		return Item.findOneAndUpdate({ _id: item._id }, { $set: item }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec();
	}).then(item => {
		logger.logInsert(req.session.user._id, item._id);
		return res.send(mapBasicItem(item));
	}).catch(reason => {
		return next(new CodedError(reason, 400));
	});
};

exports.updateItem = function (req, res, next) {

	let item = getBasicItem(req.body);
	Item.findOneAndUpdate({ _id: req.body._id }, { $set: item }, { new: true }).exec().then(item => {
		logger.logUpdate(req.session.user._id, item._id, req.body.reset ? true : false);
		return res.send(item);
	}).catch(reason => {
		return next(new CodedError(reason, 400));
	});
};

exports.removeItem = function (req, res, next) {
	Item.remove({ _id: req.params.id }).then(() => {
		return res.send(true);
	}).catch(reason => {
		return next(new CodedError(reason, 400));
	});
};

exports.buyItem = function (req, res, next) {

	let itemProm = Item.findById(req.body.item).exec();
	let userProm = User.findById(req.session.user._id).exec();
	let quantity = req.body.quantity;
	//let userProm = User.findById('58a0270f2a5a0e7725c8b4bb').exec();
	let lock = Lock('buyLock', { timeout: 1000, pollInterval: 100 });
	lock.pollAcquire().then((lockAcquired) => {
		return Promise.all([itemProm, userProm])
	}).then(values => {
		let item = values[0];
		let user = values[1];
		if (!item || !user) throw new CodedError("Invalid values", 400);
		if (!(item.quantity >= quantity && quantity * item.sellPrice <= user.money)) throw new CodedError("Low values", 400);
		itemProm = Item.findByIdAndUpdate(item._id, { $inc: { quantity: -quantity } }, { new: true }).exec();
		userProm = User.findByIdAndUpdate(user._id, { $inc: { money: -(quantity * item.sellPrice) } }).exec();
		return Promise.all([itemProm, userProm]);
	}).then(values => {
		item = values[0];
		user = values[1];
		logger.logBuy(req.session.user._id, item._id, quantity);
		return res.send(item);
	}).catch(reason => {
		return next(new CodedError(reason, 400));
	}).finally(() => {
		lock.release();
	});
};

function mapPurchase(purchase){
	return {
		_id: purchase._id,
		date: purchase.date,
		item: purchase.item,
		cancelled: purchase.options.cancelled,
		quantity: purchase.quantity
	}
}

exports.getPurchases = function (req, res, next) {

	let search = { action: 'buy' };
	if (req.params.id) {
		search['who._id'] = mongoose.Types.ObjectId(req.params.id);
	}
	Log.find(search).exec().then((purchases) => {
		let newPurchases = [];
		for (purchase of purchases) {
			newPurchases.push(mapPurchase(purchase));
		}
		return res.send(newPurchases);
	}).catch((err) => {
		return next(new CodedError(err, 400));
	})
};

exports.cancelPurchase = function (req, res, next) {
	Log.findOne({ _id: req.params.id, 'options.cancelled': false }).exec().then(log => {
		return Promise.all([
			Log.update({ _id: req.params.id }, { $set: { "options.cancelled": true } }).exec(),
			User.update({ _id: req.session.user._id }, { $inc: { money: log.quantity * log.item.sellPrice } }).exec(),
			Item.update({ _id: log.item._id }, { $inc: { quantity: log.quantity } }).exec()
		])
	}).then(()=> {
		logger.logCancel(req.session.user._id, req.params.id);
		return res.send(true);
	}).catch(reason => {
		return next(new CodedError(reason, 400));
	});
};

exports.loginAdmin = function (req, res, next) {

	let password = req.body.password;
	authController.SHA256(config.inventoryPassword).then(pass => {
		if(password !== pass) throw new CodedError('Wrong password', 403);

		res.cookie('logged', true);
		return Session.create({ session: req.sessionID });
	}).then(() => {
		return res.send(true);
	}).catch(reason => {
		return next(new CodedError(reason, 500));
	});
};