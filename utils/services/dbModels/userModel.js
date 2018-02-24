const mongoose = require('mongoose'),
Schema = mongoose.Schema
Float = require('mongoose-float').loadType(mongoose);;


const userSchema = new Schema({
	alias: { type: String, index: { unique: true, dropDups: true } },
	slug: { type: String, index: { unique: true, dropDups: true }},
	fb: {
		id: { type: String, default: "", index: true },
		name: { type: String, default: "" },
		picture: {
			data: {
				url: { type: String, default: "" }
			}
		},
		email: { type: String, default: "" }
	},
	hasPassword: { type: Boolean, default: true },
	mergedWithFB: { type: Boolean, default: false },
	email: { type: String, index: { unique: true, sparse: true, dropDups: true } },
	name: { type: String, default: "" },
	pwd: {
		hash: { type: String, default: "" },
		salt: { type: String, default: "" },
		iterations: { type: Number, default: 10000 }
	},
	ieee: { type: String, unique: true, sparse: true },
	code: { type: String, unique: true, sparse: true },
	money : { type: Float, min: 0, default: 0.0 },
	profilePic: { type: String, default: "" },
	roles: [{ type: String, default: "user" }]
});

mongoose.model('UserModel', userSchema);