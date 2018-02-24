const mongoose = require('mongoose'),
    Schema = mongoose.Schema;


const postSchema = new Schema({
    title: { type: String, default: "" },
	author: { type: Schema.Types.ObjectId, ref: 'UserModel' },
    content: { type: String, default: "" },
    excerpt: { type: String, default: "" },
    published: { type: Boolean, default: false },
    tags: [{ type: String, default: "" }],
    createDate: { type: Date, default: Date.now },
    modifiedDate: { type: Date, default: Date.now },
    publishedDate: { type: Date, default: null }
});

mongoose.model('PostModel', postSchema);