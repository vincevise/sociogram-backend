const { default: mongoose } = require("mongoose")

const CommentSchema = new mongoose.Schema({
    post:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Post'
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    text:{
        type:String,
        required:true
    },
    dateCreated:{
        type: Date,
        default: Date.now
    },
})

const Comment = mongoose.model('Comment', CommentSchema)

module.exports = {
    Comment
}