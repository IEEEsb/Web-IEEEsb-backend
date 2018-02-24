const mongoose = require('mongoose'),
    Schema = mongoose.Schema;


const logSchema = new Schema({
    date: { type: Date, default: Date.now },
	action: { type: String, required: true },
    who: { type: Schema.Types.Mixed },
    to: { type: Schema.Types.Mixed },
    item: { type: Schema.Types.Mixed },
    quantity: { type: Number },
    options: { type: Schema.Types.Mixed }
});

mongoose.model('LogModel', logSchema);