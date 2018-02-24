const mongoose = require('mongoose'),
Schema = mongoose.Schema;

const sessionSchema = new Schema({
	session: { type: String, index: { unique: true, dropDups: true } }
});

mongoose.model('SessionModel', sessionSchema);