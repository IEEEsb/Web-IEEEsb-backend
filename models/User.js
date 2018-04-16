const { model, Schema } = require('mongoose');

const userModel = model('User', new Schema({
	alias: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	surname: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	isVerified: {
		type: Boolean,
		default: false,
	},
	ieeeId: {
		type: Number,
		required: false,
	},
	balance: {
		type: Number,
		default: 0.0,
	},
	pass: {
		hash: {
			type: String,
			required: true,
		},
		salt: {
			type: String,
			required: true,
		},
	},
	picture: {
		type: String,
		required: false,
	},
	role: {
		type: [String],
		required: true,
	},
	discount: {
		type: Number,
		default: 0.0,
	},
	creationDate: {
		type: Date,
		default: Date.now(),
	},
}));

export default userModel;
