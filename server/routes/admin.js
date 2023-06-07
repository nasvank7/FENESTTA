var express=require('express')
var router=express.Router();
const admincontroller=require('../controller/admin_controller')
const multer=require('multer')
const fs=require('fs')


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
// var storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads')
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.filename + '-' + Date.now())
//     }
//   });
  
//   var upload = multer({
//     storage: storage,
//   }).single("photo");

// Configure multer middleware
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Make sure directory exists
      const uploadDir = './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      
      const originalname = file.originalname.replace(/[^a-zA-Z0-9]/g, "");

      cb(null, `${file.fieldname}_${Date.now()}_${originalname}`);
    },
  });

   const upload= multer({
    storage:storage,
   })


router.get('/admin_login',isLogged,(req,res)=>{
    res.render('admin/admin_login')
})

router.get('/admin_index',adminLoggedIn,admincontroller.Dashboard)


router.post('/admin_login',admincontroller.adminLogin)
router.get('/users',adminLoggedIn,admincontroller.find_user)
router.get('/products',adminLoggedIn,admincontroller.find_product)
router.get('/add_product_page',adminLoggedIn,admincontroller.add_Product)
router.post('/add_product',upload.array('photo',5),admincontroller.addProduct)
router.get('/redo/:id',admincontroller.redo)
router.get('/undo/:id',admincontroller.undo)
router.get('/category_page',adminLoggedIn,admincontroller.category_find)
router.get('/add_category',adminLoggedIn,admincontroller.add_Category)
router.post('/add_category',admincontroller.add_category)
router.get('/block_user/:id',admincontroller.block_user)
router.get('/unblock_user/:id',admincontroller.unblock_user)
router.get('/update_product/:id',admincontroller.updateProduct)
router.post('/update_product/:id',upload.array('photo',5),admincontroller.updateproduct)
router.post('/search',adminLoggedIn,admincontroller.Search)
router.get('/Search',adminLoggedIn,admincontroller.userSearch)

router.get('/delete_category/:id',admincontroller.deleteCategory)
router.get('/order-details',adminLoggedIn,admincontroller.orderData)
router.post('/edit_status/:id',admincontroller.update_status)

router.get('/orderDetail/:id',admincontroller.Details)
router.get('/coupon',adminLoggedIn,admincontroller.Coupon)
router.get('/add_coupon_page',adminLoggedIn,admincontroller.AddCoupon)
router.post('/add_coupon',admincontroller.addCoupon)
router.get('/refund/:id',admincontroller.Refund)
router.get('/adminlogout',admincontroller.Logout)
router.get('/deactivateCoupon/:id',admincontroller.CouponDeactivate)
router.get('/activateCoupon/:id',admincontroller.CouponActivate)
router.get('/banner',adminLoggedIn,admincontroller.Banner)
router.get('/addBanner',admincontroller.AddBanner)
router.post('/addBanner',upload.array('photo',5),admincontroller.ADDBanner)
router.get('/activateBanner/:id',admincontroller.activateBanner)
router.get('/salesreport',admincontroller.SalesReport)
router.post('/adminSalesReportFilter',admincontroller.FilterbyDates)



module.exports=router