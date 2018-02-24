const mongoose = require('mongoose'),
Schema = mongoose.Schema;

const itemSchema = new Schema({
	code: { type: Number, default: 0, index: { unique: true, dropDups: true } },
	name: { type: String, default: "", index: { unique: true, dropDups: true } },
	location: {
		main: { type: String, default: "" },
		sub: { type: String, default: "" }
	},
	tags: [{ type: String, default: "" }],
	goodState: { type: Boolean, default: true },
	type: { type: String, default: "consumable" },
	borrowed: { type: Number, default: 0 },
	buyPrice: { type: Number, default: 0.00 },
	sellPrice: { type: Number, default: 0.00 },
	quantity: { type: Number, min: 0, default: 0 },
	icon: { type: String, default: "" },
	files: [{ type: String, default: "" }]
});

mongoose.model('ItemModel', itemSchema);