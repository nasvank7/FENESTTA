
var express=require('express')
var router=express.Router();
var usercontroller=require('../controller/user_controller')
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


router.get('/',usercontroller.index)
router.get('/login',usercontroller.getLogin)
router.get('/signup',isLogged,usercontroller.dosignup)
router.post('/signup',usercontroller.doSignup)
router.post('/login',usercontroller.dologin)
router.get('/logout',usercontroller.logout)
router.get('/newarrival',usercontroller.newArrival)
router.get('/shop',usercontroller.product_list)
router.get('/home',usercontroller.Home)
router.get('/single/:id',usercontroller.single_product)
router.get('/login-otp',usercontroller.getlogin_otp)
router.post('/sendotp',usercontroller.sendotp)
router.post('/verifyotp',usercontroller.verifyotp)
router.get('/cart',isLoggedIn,isUserBlocked,usercontroller.getCart)
router.get('/add-to-cart/:id',usercontroller.addtocart)
router.post('/increaseQuantity',usercontroller.updateQuantity)
router.post('/decreaseQuantity',usercontroller.decrementQuantity)
// router.get('/delete_cart/:id',usercontroller.deleteproduct)
router.post('/productRemove',usercontroller.productRemove)

router.get('/address',isLoggedIn,isUserBlocked,usercontroller.checkOut)
router.post('/address',usercontroller.Addaddress)

router.get('/checkout/:id',isLoggedIn,isUserBlocked,usercontroller.Checkout)
router.get('/hoodies',usercontroller.getHoodies)
router.get('/shirts',usercontroller.getShirts)
router.get('/tshirts',usercontroller.getTshirts)
router.post('/order/:id',isLoggedIn,usercontroller.orderConfirmation)


router.get('/orderDetails',isLoggedIn,isUserBlocked,usercontroller.orderDetail)
router.get('/userProfile',isLoggedIn,isUserBlocked,usercontroller.userProfile)
router.get('/userAddress',isLoggedIn,isUserBlocked,usercontroller.UserAdressess)
router.get('/userOrder',isLoggedIn,isUserBlocked,usercontroller.UserOrder)
router.get('/updateProfile/:id',isLoggedIn,isUserBlocked,usercontroller.updateProfile)
router.post('/updateProfile/:id',isLoggedIn,isUserBlocked,usercontroller.UpdateProfile)
router.post('/updatePassword/:id',isLoggedIn,isUserBlocked,usercontroller.updatePassword)


router.get('/paypal-success',usercontroller.paypalSuccess)
router.post('/cancel_product/:id',usercontroller.Cancelorder)
router.post('/return_product/:id',usercontroller.Returnorder)
router.get('/orderView/:id',usercontroller.OrderView)

router.get('/LTH',usercontroller.LowToHigh)
router.get('/HTL',usercontroller.HighToLow)
router.post('/searchProducts',usercontroller.searchProducts)
router.get('/forgotPassword',usercontroller.Forgotpage)
router.post('/forgetOtp',usercontroller.SendOTP)
router.post('/fverifyOtp',usercontroller.verifyForget)
router.post('/verify_password',usercontroller.forgot_password)
router.post('/redeem_coupon',usercontroller.redeemCoupon)
router.get('/wallet',isLoggedIn,usercontroller.Wallet)
router.get("/editAddress/:id",isLoggedIn,isUserBlocked,usercontroller.EditAddress)
router.post("/updateAddress/:id",isLoggedIn,isUserBlocked,usercontroller.updateAddress)
router.get('/invoice/:id',isLoggedIn,isUserBlocked,usercontroller.Invoice)
module.exports =router