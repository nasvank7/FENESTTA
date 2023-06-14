const userSchema = require("../model/model");

const isLogged=(req,res,next)=>{
    if(req.session.user){
        res.redirect('/')
    }else{
        next()
    }
}
const isLoggedIn=(req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect('/')
    }
}

const isUserBlocked=async(req,res,next)=>{
    const userId=req.session.user?._id
    const user= await userSchema.findById(userId)
  
    if(user.isBlocked){
        req.session.save(() => {
            req.session.user=false
            res.redirect('/login'); 
         })
         return

    }else{
      next()
    }
}


module.exports={
    isLogged,
    isLoggedIn,
    isUserBlocked
}