var express=require('express')
var router=express.Router();
var usercontroller=require('../controller/user_controller')



router.get('/',usercontroller.index)
router.get('/login',usercontroller.getLogin)
router.get('/signup',usercontroller.dosignup)
router.post('/signup',usercontroller.doSignup)
router.post('/login',usercontroller.dologin)
router.get('/logout',usercontroller.logout)
router.get('/shop',usercontroller.product_list)
router.get('/home',usercontroller.Home)
router.get('/single/:id',usercontroller.single_product)
router.get('/login-otp',usercontroller.getlogin_otp)

// router.get('/logout',(req,res)=>{
//     req.session.destroy(function(err){
//         if(err){
//             console.log(err);
//             res.send("Error")
//         }else{
//             res.render('base',{title:"Express",logout:"logout successfully...!"})
//         }
//     })
// })

module.exports =router