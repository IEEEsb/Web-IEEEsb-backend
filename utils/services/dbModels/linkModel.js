const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const linkSchema = new Schema({
    text: { type: String, default: "" },
    isHeader: { type: Boolean, default: false },
    icon: { type: String, default: "" },
    link: {
        ext: { type: Boolean, default: false },
        url: { type: String, default: "" },
        params: [{
            key: { type: String, default: "" },
            value: { type: String, default: "" }
        }]
    },
    position: { type: Number, default: 0 },
    top: { type: Boolean, default: false },
    dropdown: [{ type: Schema.Types.ObjectId, ref: 'LinkModel' }],
    left: { type: Boolean, default: true }
});

linkSchema.index({isHeader: 1}, {unique: true, partialFilterExpression: {isHeader: true}});

mongoose.model('LinkModel', linkSchema);