const bcrypt=require('bcrypt')
const userSchema=require('../model/model')
const productSchema=require('../model/product_model')
const session = require('express-session')
const fs=require('fs')

exports.index=(req,res)=>{
    let user =req.session.user
    res.render('user/index', {user})
}
exports.Home=(req,res)=>{
    let user =req.session.user
    res.render('user/index', {user})
}
exports.getLogin=(req,res)=>{
    res.render('user/login')
}
exports.dosignup=(req,res)=>{
    res.render('user/signup')
}
exports.doSignup=(req,res)=>{
    const saltRounds=10;
    bcrypt.hash(req.body.password,saltRounds,(err,hash)=>{
        if(err){
            res.status(500).send({
                message:
                err.message || "Some error occurred while hashing the password",
            })
            return
        }
        const user=new userSchema({
           name:req.body.name,
            email:req.body.email,
            phone:req.body.phone,
            password:hash
        })
        user
        .save()
        .then(()=>{
            res.render('user/login'),{msg:"successfully registered"}
        })
        .catch((err)=>{
            res.send({message:"error occured while registering"})
        })
    })
}
exports.dologin=async(req,res)=>{
    const email=req.body.email
    const password=req.body.password
    try {
        const user=await userSchema.findOne({email:email})

        if(user){

            const isMatch=await bcrypt.compare(password,user.password)
            if(isMatch){
                req.session.user = user;
                res.redirect('/');
            }else{
                res.render('user/login',{message:"Invalid entry"})
            }
          
           
        }
    
    } catch (error) {
        console.log(error);
        res.send("An error occured while logged in")
    }
}

exports.logout=(req,res)=>{
    req.session.destroy(function(err){
      if(err){
        console.log(err)
        res.send("Error")
      }else{
        res.render('user/index',{user:false})
      }
    })
  }
  exports.product_list=async(req,res)=>{
    const product=await productSchema.find().limit(6)
    const user=req.session.user
    res.render('user/shop',{product,user})
  }
  exports.single_product=async(req,res)=>{
    const {id} =req.params
    const product=await productSchema.find()
    const user=req.session.user
    res.render('user/single-product',{product,user})
  }
  exports.getlogin_otp=(req,res)=>{
    res.render('user/login-otp')
  }