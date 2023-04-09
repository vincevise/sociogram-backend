const sharp = require("sharp")
const { uploadFile } = require("../S3/S3")
const { Post } = require("../models/Post")
const crypto = require('crypto');
const { User } = require("../models/User");
const generateFileName = (bytes = 6) => crypto.randomBytes(bytes).toString('hex')


const createPost = async(req, res) => {
    const file = req.file
    const {description, userId} = req.body 
    // console.log(file)
    const imageName = generateFileName().slice(0,5)
    try {

        if(req.file){
            const key = `${imageName}.${file.mimetype.split('/')[1] }`
            const fileBuffer = await sharp(file.buffer)
                .resize({ height: 1080, width: 1920, fit: "contain" })
                .toBuffer()
            const response = await uploadFile(file.buffer, imageName, file.mimetype)

            const post = await Post.create({
                description,
                user:userId,
                postImage:{
                    name:key,
                    url:''
                }
            })
            let url = "https://sociogram.s3.ap-south-1.amazonaws.com/" + post.postImage.name.split('.')[0]

            post.postImage.url = url
    
            return res.status(200).json({data:post}) 
        }

        const post = await Post.create({
            description,
            user:userId, 
        })
        res.status(200).json({data:post}) 
    } catch (error) {
        console.error(error)
        res.status(400).json({error:error.message})
    }
}

const likePost = async(req, res) =>{
    const {postId, like, userId} = req.body
    try {
        let post;
        if(like){
            action = {$addToSet:{likes:userId}}
        }else{
            action = {$pull:{likes:userId}}
        }

        post = await Post.findByIdAndUpdate(
            postId,
            action,
            {new:true}
        ).populate({
            path: 'likes',
            select:'username'
        })
        // console.log(post)
        res.status(200).json({post})
    } catch (error) {
        console.error(error)
        res.status(400).json({error:error.message})
    }
}

const getPostDiscover = async(req, res) => {
    const {userId} = req.body
    try {
        const user = await User.findById(userId)
        // const posts = await Post.aggregate([
        //     {
        //       $match: {
        //         user: {
        //           $nin:  user.followers,
        //           $nin: user.following,
        //           $ne: userId
        //         }
        //       }
        //     },
        //     {
        //       $lookup: {
        //         from: 'users',
        //         localField: 'user',
        //         foreignField: '_id',
        //         as: 'user'
        //       }
        //     },
        //     {
        //       $unwind: '$user'
        //     },
        //     {
        //       $project: {
        //         _id: 1,
        //         user: {
        //           _id: 1,
        //           username: 1,
        //           avatar: 1,
        //           firstname: 1,
        //           lastname: 1
        //         },
        //         likes: 1
        //       }
        //     },
        //     {
        //       $lookup: {
        //         from: 'users',
        //         localField: 'likes',
        //         foreignField: '_id',
        //         as: 'likes'
        //       }
        //     },
        //     {
        //       $project: {
        //         _id: 1,
        //         user: 1,
        //         description: 1,
        //         likes: {
        //           _id: 1,
        //           username: 1
        //         }
        //       }
        //     }
        //   ]);
          

        const posts = await Post.find({
            user:{
                $ne: userId, 
                $nin: user.followers, 
                $nin: user.following
            }})
            .populate({
                path:'user',
                select:'_id username avatar firstname lastname'
            })
            .populate({
                path:'likes',
                select:'_id username'
            })
            .populate({
                path:'comments',
                populate: {
                    path: 'user',
                    select: '_id username firstname lastname avatar'
                },
                select:'post user text _id',
                options: {
                    sort: { dateCreated: -1 }
                }
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
        console.log(posts)
        res.status(200).json(posts)
    } catch (error) {
        console.error(error)
        res.status(400).json({error:error.message})
    }
}

const getPostHome = async(req, res)=>{
    const {userId} = req.body
    try {
        
        const user = await User.findById(userId)

        const usersIds = [...user.following, ...user.followers]
        const posts = await Post.find({ user: { $in: usersIds } })
        .populate({
            path:'user',
            select:'_id username firstname lastname avatar'
        })
        .populate({
            path:'likes',
            select:'username _id'
        })
        .populate({
            path:'comments',
            populate: {
                path: 'user',
                select: '_id username firstname lastname avatar'
            },
            select:'post user text _id',
            options: {
                sort: { dateCreated: -1 }
            }
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
            post.comments.forEach((comment)=>{
                if(comment.user.avatar.name!==''){
                    let url = "https://sociogram.s3.ap-south-1.amazonaws.com/" + comment.user.avatar.name?.split('.')[0]
                    comment.user.avatar.url = url
                }
            })
        })

        res.status(200).json(posts)
    } catch (error) {
        res.status(400).json({error:error.message})
    }
}

const getPostUsers = async(req, res) => {
    const {id} = req.params
    try {
        const user = await User.findOne({username: id}, '_id')
        const posts = await Post.find({user:user._id})
        .populate({
            path:'user',
            select:'_id username firstname lastname avatar'
        })
        .populate({
            path:'likes',
            select:'username _id'
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

        res.status(200).json(posts)
    } catch (error) {
        res.status(400).json({error:error.message})
    }
} 


 

module.exports = {
    createPost,
    likePost,
    getPostDiscover,
    getPostHome,
    getPostUsers
}  