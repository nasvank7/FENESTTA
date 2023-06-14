const isLogged=(req,res,next)=>{
    if(req.session.admin){
        res.redirect('/admin_index')
    }else{
        next()
    }
  }
  
  const adminLoggedIn=(req,res,next)=>{
    if(req.session.admin){
        next()
    }else{
        res.redirect('/admin_login')
    }
  }

  

module.exports={
    isLogged,
    adminLoggedIn,

}