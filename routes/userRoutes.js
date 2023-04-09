const multer = require('multer')
const {  loginUser, createUser, loginJWT, getAllUsers, authHelper, addUserToFollowerArray, removeUserToFollowerArray, suggestedUsers, getOneUser, getOneUser1, uploadProfilePic, getUrl, updateBio, searchUser } = require('../controller/userController')

const userRouter = require('express').Router()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
 

userRouter.post('/registerUser', createUser)
userRouter.post('/loginUser', loginUser)
userRouter.post('/loginWithToken', loginJWT)

userRouter.get('/getOneUser/:id',getOneUser)
userRouter.get('/getOneUser1/:id',getOneUser1)


userRouter.post('/uploadProfile', upload.single('image'),authHelper, uploadProfilePic)

userRouter.post('/updateBio', authHelper, updateBio) 

userRouter.post('/getAllUsers',authHelper, getAllUsers)
userRouter.put('/addfollower', authHelper, addUserToFollowerArray)
userRouter.put('/removefollowing', authHelper, removeUserToFollowerArray)
userRouter.post('/suggestedUsers',authHelper, suggestedUsers)

userRouter.get('/getUrl',getUrl)
userRouter.get('/search',searchUser)


 

  
 
  

module.exports = {userRouter}