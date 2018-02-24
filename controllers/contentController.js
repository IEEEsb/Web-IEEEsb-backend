const services = require("../utils/services.js"),
config = services.config,
mongoose = require('mongoose'),
Link = mongoose.model('LinkModel'),
Post = mongoose.model('PostModel'),
CodedError = require('../utils/CodedError.js'),
winston = require('winston');

const systemLogger = winston.loggers.get('system');

exports.savePost = function (req, res, next) {

	let post = {};
	let id = req.body._id && req.body._id !== "" ? req.body._id : new mongoose.Types.ObjectId;
	post.title = req.body.title ? req.body.title : "";
	post.author = req.session.user;
	post.content = req.body.content ? req.body.content : "";
	post.excerpt = req.body.excerpt ? req.body.excerpt : "";
	post.published = req.body.published ? req.body.published : false;
	post.tags = req.body.tags ? req.body.tags : [];
	post.modifiedDate = new Date;


	Post.findOneAndUpdate({ _id: id }, { $set: post }, {upsert:true, new: true, setDefaultsOnInsert: true}).exec().then(post => {
		return res.send(post);
	}).catch(reason => {
		return next(new CodedError(reason, 500));
	});
};

exports.getPost = function (req, res, next) {
	console.log(req.params.id);
	Post.findById(req.params.id).populate('author', 'alias').exec().then(post => {
		console.log(post);
		return res.send(post);
	}).catch(reason => {
		return next(new CodedError(reason, 500));
	});
};

exports.getPosts = function (req, res, next) {

	Post.find().sort({publishedDate: -1}).populate('author', 'alias').exec().then(posts => {
		return res.send(posts);
	}).catch(reason => {
		return next(new CodedError(reason, 500));
	});
};

exports.removePost = function (req, res, next) {

	Post.findOneAndRemove({ _id: req.params.id }).exec().then(post => {
		return res.send(post);
	}).catch(reason => {
		return next(new CodedError(reason, 500));
	});
};

exports.publishPost = function (req, res, next) {

	Post.update({ _id: req.params.id }, { $set: { published: true, publishedDate: new Date }}).exec().then(() => {
		return res.send(true);
	}).catch(reason => {
		return next(new CodedError(reason, 500));
	});
};