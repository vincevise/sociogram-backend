 
const { User } = require('../models/User'); 

const jwt = require("jsonwebtoken");
require('dotenv').config() 

const bcrypt = require("bcryptjs");
const { default: mongoose } = require('mongoose');
const crypto = require('crypto');
const sharp = require('sharp');
const { uploadFile, getObjectSignedUrl } = require('../S3/S3');
const { Post } = require('../models/Post');

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

 
 

const authHelper = async(req, res, next)=>{
    
    try {   
        const authToken = req.headers.authorization.split(' ') 
        if(authToken[0]!=='Bearer'){
            return res.status(400).json({error:'Authentication error'})
        }
        const { UserID } = jwt.verify(authToken[1], process.env.SECRET_KEY);

        if(!UserID) return res.status(400).json({error:"Id not found"}) 
        req.body.userId = UserID
        next()
    } catch (error) {
        res.status(400).json({error:error.message})
    }
}

const createUser = async(req,res) => {
    const {username, firstname, lastname, email, password} = req.body
    try{
        const newUser = await User.create({ 
            username,
            firstname,
            lastname,
            email,
            password, 
        })

        const token = await jwt.sign(
            {UserID:newUser._id},
            process.env.SECRET_KEY,
            {expiresIn: '10d'}
        )

        res.status(200).json({
            message:'created successfully',
            data: newUser,
            token: token
        })
        
    }catch(error){
        console.error(error)
        res.status(400).json({error:error.message})
    }
}

const loginUser = async (req,res) =>{
    const { email, password } = req.body; 
    try {
        if (!email || !password) {
            return res.status(400).json({ error: "Please fill all the details" });
        }
        const isUser = await User.findOne({ email: email },);
        // console.log(isUser, 'isUser')
        if (!isUser) {
            return res.status(400).json({ error: "User does not exists" });
        }
        const isValid = await bcrypt.compare(password, isUser.password);
        

        if (!isValid) return res.status(400).json({ error: "password invalid" });

        const token = await jwt.sign(
            { UserID: isUser._id },
            process.env.SECRET_KEY,
            { expiresIn: "2d" }
        );

        if (!token) {
            return res.status(400).json({ error: "Token error" });
        }
        res.status(200).json({
            token: token, 
            isUser
        });

    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message });
    }
}


const loginJWT = async (req, res, next) => {
    const authToken = req.headers.authorization.split(' ')  
    if(authToken[0]!=='Bearer'){
        return res.status(400).json({error:' Authentication Error'})
    }
    try {
        // const token = req.headers.cookies;
        const { UserID } = jwt.verify(authToken[1], process.env.SECRET_KEY); 
        if (!UserID) return res.status(400).json({ error: "Authentication error" });

        if (!mongoose.Types.ObjectId.isValid(UserID)) {
            return res.status(400).json({ error: 'Invalid UserID' });
          }
        
        const id = new mongoose.Types.ObjectId(UserID) 
        const user = await User.findById(id,'-password') 

        // const url = await getObjectSignedUrl(user.avatar.name)
        if(user.avatar.name.length > 0){
            let url = "https://sociogram.s3.ap-south-1.amazonaws.com/" + user.avatar.name.split('.')[0]
            user.avatar.url = url 
        } 
        
        res.status(200).json({
            message:'successfull',
            data:user
        })
    //   next();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
};

const getOneUser = async(req, res)=>{
    const {id} = req.params

    try {
        let user = await User.findOne({username:id} )
            .populate('followers', '-password')
            .populate('following', '-password')
            .select('-password')
        
        if(!user)return res.status(400).json({error:'user not found'})
        
        if(user.avatar.name.length > 0){
            let url = "https://sociogram.s3.ap-south-1.amazonaws.com/" + user.avatar.name.split('.')[0]
            user.avatar.url = url 
        }

        user.followers.forEach((x)=>{
            if(x.avatar.name.length > 0){
                let url = "https://sociogram.s3.ap-south-1.amazonaws.com/" + x.avatar.name.split('.')[0]
                x.avatar.url = url 
            }
        })

        user.following.forEach((x)=>{
            if(x.avatar.name.length > 0){
                let url = "https://sociogram.s3.ap-south-1.amazonaws.com/" + x.avatar.name.split('.')[0]
                x.avatar.url = url 
            }
        })

        const posts = await Post.find({user:user._id})
        .populate({
            path: 'user',
            select: 'username avatar firstname lastname' // include only the name and profilePicture fields
        })
        .populate({
            path: 'likes',
            select:'-password'
        })

        posts.forEach((post)=>{
            if(post.postImage && post.postImage.name){
                let url = "https://sociogram.s3.ap-south-1.amazonaws.com/" + post?.postImage?.name?.split('.')[0]
                post.postImage.url = url
            }
            if(post.user.avatar.name!==''){
                let url = "https://sociogram.s3.ap-south-1.amazonaws.com/" + post.user.avatar.name?.split('.')[0]
                post.user.avatar.url = url
            }
        })

        user.posts = posts
        
        res.status(200).json({user})
    } catch (error) {
        console.error(error)
        res.status(400).json({error:error.message})
    }
}

const getOneUser1 = async(req, res)=>{
    const {id} = req.params

    try {
        let user = await User.findOne({username:id}  )
            .populate('followers', '-password')
            .populate('following', '-password')
            .select('-password')
        
        if(!user)return res.status(400).json({error:'user not found'})
        user.avatar.url = 'https://example.com/avatar.jpg' 
        res.status(200).json({user})
    } catch (error) {
        res.status(400).json({error:error.message})
    }
}

const getAllUsers = async(req, res) => {
    // console.log(req.body, 'token')
    const {userId} = req.body
    // console.log(userId)
    try { 
        const users = await User.find({_id:{$ne:userId}},'-password') 
        .exec() 
 
        if(!users){
            return res.status(400).json({error: 'no users'})
        }

        res.status(200).json({users})

    } catch (error) {   
        console.error(error)
        res.status(400).json({error:error.message})
    }
}

 

const addUserToFollowerArray = async(req,res) => {
    // console.log(req.body, 'token') 
    const {userId, newFollowerId} = req.body
    try{
        const currentUser = await User.findByIdAndUpdate(userId,
            { $addToSet:{ following:newFollowerId}},
            {new: true},
        ).select('-password')
        if(!currentUser) return res.status(400).json({message:'no current user'})

        const followingUser = await User.findByIdAndUpdate(newFollowerId,
            { $addToSet:{ followers: userId}},
            {new: true}
        ).select('-password')
        if(!followingUser) return res.status(400).json({message:'no following user'})


        res.status(200).json({currentUser, followingUser})
    }catch(error){
        console.error(error.message)
        res.status(400).json({error:error.message})
    }
}

const removeUserToFollowerArray = async(req,res) => {
    // console.log(req.body, 'token') 
    const {userId, userIdToRemove} = req.body
    try{
        const currentUser = await User.findByIdAndUpdate(userId,
            { $pull:{ following:userIdToRemove}},
            {new: true}
        ) 
        if(!currentUser) return res.status(400).json({message:'no current user'})

        const followingUser = await User.findByIdAndUpdate(userIdToRemove,
            { $pull:{ followers: userId}},
            {new: true}
        ) 
        if(!userIdToRemove) return res.status(400).json({message:'no following user'})


        res.status(200).json({currentUser, followingUser})
    }catch(error){
        console.error(error.message)
        res.status(400).json({error:error.message})
    }
}

const suggestedUsers = async(req, res) => {
    // console.log(req.body)
    const {userId} = req.body
    try {
        const user = await User.findById(userId, '-password')

        const suggestedusers = await User.aggregate([
            { $match: { _id: { $nin: user.following, $ne: user._id } } }, 
            { $sort: { dateCreated: -1 } } ,
            {  $project:{
                password: 0,
            }}
        ])

        suggestedusers.forEach((suggestedUser) => {
            if(suggestedUser.avatar.name.length > 0){
                let url = "https://sociogram.s3.ap-south-1.amazonaws.com/" + suggestedUser.avatar.name.split('.')[0]
                suggestedUser.avatar.url = url 
            } 
        }); 
        res.status(200).json({message:'success',suggestedusers})
    } catch (error) {
        console.error(error)
        res.status(400).json({error:error.message})
    }
}

const uploadProfilePic = async(req,res) => {
    const {userId} = req.body
    const file = req.file
    const imageName = generateFileName()
    try{

        const fileBuffer = await sharp(file.buffer)
        .resize({ height: 1920, width: 1080, fit: "contain" })
        .toBuffer()

        const key = `${imageName}.${file.mimetype.split('/')[1] }`

        const user = await User.findByIdAndUpdate(
            userId,
            {$set: {'avatar.name':key }},
            {new: true}
        )
        
        const response = await uploadFile(fileBuffer, imageName, file.mimetype)

        const url = await getObjectSignedUrl(key)
 
        res.status(200).json({image:response, key, url})
    }catch(error){
        console.error(error)
        res.status(400).json({error:error.message})
    }
}

const updateBio = async(req,res)=>{
    const {bio, userId} = req.body
    // console.log(req.body)
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            {$set: {bio: bio }},
            {new: true}
        )
        res.status(200).json({user})
    } catch (error) {
        res.status(400).json({error:error.message})
    }
}

const getUrl = async(req,res) => {
    try{
        const response = await getObjectSignedUrl('PIYUSHBHAI.png')
        res.status(200).json({url:response}) 

    }catch(error){
        console.error(error)
        res.status(400).json({error:error.message})
    }
}

const searchUser = async (req, res) => {
    try {
        const searchTerm = req.query.q

        // Search for users whose name or email fields match the search term
        const users = await User.find({
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { firstname: { $regex: searchTerm, $options: 'i' }},
                { lastname: { $regex: searchTerm, $options: 'i' }},
            ]
        },'-password')

        users.forEach((user) => {
            if(user.avatar.name.length > 0){
                let url = "https://sociogram.s3.ap-south-1.amazonaws.com/" + user.avatar.name.split('.')[0]
                user.avatar.url = url 
            } 
        }); 

        res.status(200).json(users)
    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
}

module.exports = {  
    createUser,
    loginUser,
    loginJWT, 
    getAllUsers,
    authHelper,
    addUserToFollowerArray,
    removeUserToFollowerArray,
    suggestedUsers,
    getOneUser,
    getOneUser1,
    uploadProfilePic,
    updateBio,
    getUrl,
    searchUser
}