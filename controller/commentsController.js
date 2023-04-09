const { Comment } = require("../models/Comment")
const { Post } = require("../models/Post")

const createComment = async(req, res)=> { 
    try {
        const {post, comment, userId} = req.body

        const newComment = await Comment.create(
            {
                user:userId, 
                text:comment,  
                post
            }
        )
        
        await newComment.populate({
            path:'user',
            select:'_id username avatar firstname lastname'
        })

        if(newComment.user.avatar.name.length > 0){
            const url = "https://sociogram.s3.ap-south-1.amazonaws.com/" + newComment.user.avatar.name.split('.')[0]
            newComment.user.avatar.url = url
        }

        const result = await Post.findByIdAndUpdate(
            post,  
            { $addToSet:{ comments: newComment._id}}, 
            {new : true}
        ) 

        res.status(200).json({comment:newComment})
    } catch (error) {
        console.error(error.message)
        res.status(400).json({error:error.message})
    }
}

const deleteComment = async(req,res)=>{
    const {comment, post} = req.body
    // const currentUser = await User.findByIdAndUpdate(userId,
    //     { $pull:{ following:userIdToRemove}},
    //     {new: true}
    // ) 
    try {
        const responsePost = await Post.findByIdAndUpdate(
            post,
            {$pull:{comments:comment}},
            {new: true}
        )

        const responseComment = await Comment.findByIdAndDelete(comment)

        res.status(200).json({comment, post})
    } catch (error) {
        console.error(error.message)
        res.status(400).json({
            error:error.messsage
        })
    }
}

const editComment = async(req, res) => {
    console.log(req.body)
    const {id, comment} = req.body.data
    try {
        const newComment = await Comment.findById(id)
        if (!newComment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        newComment.text = comment;
        await Comment.findByIdAndUpdate(id, newComment);
        console.log(newComment)
        res.status(200).json({ comment: newComment });
    } catch (error) {
        console.error(error)
        res.status(400).json({error:error.message})
    }
}

module.exports = {
    createComment,
    deleteComment,
    editComment
}