
var express=require('express')
var router=express.Router();
var usercontroller=require('../controller/user_controller')

const isLogged=(req,res,next)=>{
    if(req.session.user){
        res.redirect('/')
    }else{
        next()
    }
}

router.get('/',usercontroller.index)
router.get('/login',isLogged,usercontroller.getLogin)
router.get('/signup',isLogged,usercontroller.dosignup)
router.post('/signup',usercontroller.doSignup)
router.post('/login',usercontroller.dologin)
router.get('/logout',usercontroller.logout)
router.get('/shop',usercontroller.product_list)
router.get('/home',usercontroller.Home)
router.get('/single/:id',usercontroller.single_product)
router.get('/login-otp',usercontroller.getlogin_otp)
router.post('/sendotp',usercontroller.sendotp)
router.post('/verifyotp',usercontroller.verifyotp)
router.get('/cart',usercontroller.getCart)
router.get('/add-to-cart/:id',usercontroller.addtocart)
router.get('/changeQuantity',usercontroller.changeQuantity)


module.exports =router