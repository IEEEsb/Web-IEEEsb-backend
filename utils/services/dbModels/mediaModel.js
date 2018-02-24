const mongoose = require('mongoose'),
Schema = mongoose.Schema;


const mediaSchema = new Schema({
	name: { type: String },
	url: { type: String },
	createdOn: { type: Date, default: Date.now },
	mimeType: { type: String, default: ""}
});

mongoose.model('MediaModel', mediaSchema);