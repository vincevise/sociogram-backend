const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const PostSchema = new mongoose.Schema({  
    description:{
        type:String
    },
    postImage:{
        name:{
            type:String
        },
        url:{
            type:String
        }
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    likes:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User' 
    }],
    comments:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Comment'
    }],
    dateCreated:{
        type: Date,
        default: Date.now
    },
})

 


const Post = mongoose.model("Post", PostSchema)

module.exports = {
    Post
}