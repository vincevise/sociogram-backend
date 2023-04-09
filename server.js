const express = require('express')
const cors = require('cors')
require('dotenv').config() 
const { userRouter } = require('./routes/userRoutes'); 
const { connectDB } = require('./config/db'); 
const { postsRouter } = require('./routes/postsRouter'); 
const { commentsRouter } = require('./routes/commentsRouter');
const app = express() 
connectDB().then(()=>console.log('database connected'))

 

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  });
app.use(cors())
app.use(express.json())

app.use(express.urlencoded({ extended: true })); 

 

app.get('/',(req,res)=>{
    res.send('ok')
})

app.use('/api/user', userRouter)
app.use('/api/posts', postsRouter)
app.use('/api/comments', commentsRouter)
app.use('/api/social',async(req,res)=>{
  res.status(200).json({message:'working'})
})


app.listen(4000, ()=>console.log('running on port 4000'))