const mongoose = require('mongoose')

const bookschema = mongoose.Schema({
    image:String,
    bookname:String,
    authorname:String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
})

module.exports = mongoose.model("book", bookschema)