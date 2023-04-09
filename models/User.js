const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema({ 
    username:{
        type:String,
        unique:[true,'this username already exist'],
        required:[true, 'Please enter the username']
    },
    firstname:{
        type:String, 
        required:[true, 'Please enter firstname']
    },
    lastname:{
        type:String, 
        required:[true, 'Please enter LastName']
    },
    email:{
        type:String,
        unique:[true,'this email already exist'],
        required:[true, 'Please enter the email']
    },
    password:{
        type:String,
        required:[true, 'please enter your password']
    },
    avatar:{
        name:{
            type:String,
            default:''
        },
        url:{
            type:String,
            default:''
        }
    },
    followers:[{
        type:  mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    following:[{
        type:  mongoose.Schema.Types.ObjectId,
        ref:'User' 
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }], 
    bio:{
        type:String,
        default:''
    },
    dateCreated:{
        type: Date,
        default: Date.now
    },
})

UserSchema.pre('save',async function(){
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(this.password,salt)
    this.password = hashedPassword
})



const User = mongoose.model("User", UserSchema)

module.exports = {
    User
}