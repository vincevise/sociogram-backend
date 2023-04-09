const multer = require('multer')
const { createPost, likePost, getPostHome, getPostDiscover, getPostUsers } = require('../controller/postsController')
const { authHelper } = require('../controller/userController')

const postsRouter = require('express').Router()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// postsRouter.use(upload.single('image'))

postsRouter.post('/createPost',upload.single('image'), authHelper, createPost)
postsRouter.post('/likePost', authHelper, likePost)
postsRouter.post('/getPostHome', authHelper, getPostHome)
postsRouter.post('/getPostDiscover', authHelper, getPostDiscover) 
postsRouter.get('/profile/:id', getPostUsers)

 


module.exports = {
    postsRouter
}   