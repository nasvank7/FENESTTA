const express=require('express')
const path=require('path')
const bodyparser=require('body-parser')
const session=require('express-session')
const mongoose=require('mongoose')
require('dotenv').config()
const userRouter=require('./server/routes/user')
const adminRouter=require('./server/routes/admin')
const twilioRouter=require('./server/routes/twilio-sms')
const app=express()
const db=require('./server/connection/connection')
app.set('view engine','ejs')

app.use(express.static(path.join(__dirname,'public')))
app.use(express.static("uploads"));
app.use(session({
    secret:"secret",
    resave:"false",
    cookie:{sameSite:"strict"},
    saveUninitialized:true,
}))

app.use(bodyparser.urlencoded({extended:false}))



app.use(userRouter);
app.use(adminRouter);
app.use(twilioRouter);


app.listen(3000,(req,res)=>{
    console.log('server is started');
})