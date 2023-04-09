const { createComment, deleteComment, editComment } = require('../controller/commentsController')
const { authHelper } = require('../controller/userController')

const commentsRouter = require('express').Router()

commentsRouter.post('/create-comment',authHelper, createComment)

commentsRouter.delete('/delete-comment',deleteComment)
commentsRouter.put('/update-comment',editComment)

module.exports = {
    commentsRouter
}