var express=require('express')
var router=express.Router();
const admincontroller=require('../controller/admin_controller')
const offercontroller=require('../controller/offer_controller')
const bannercontroller=require('../controller/banner_controller')
const couponcontroller=require('../controller/couponcontoller')
const ordercontroller=require('../controller/order_controller')
const walletcontroller=require('../controller/wallet_controller')
const productcontroller=require('../controller/product_controller')
const categorycontroller=require('../controller/category_controller')


const multer=require('multer')
const fs=require('fs')
const adminAuth=require('../middlewares/adminAuth')

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


router.get('/admin_login',adminAuth.isLogged,(req,res)=>{
    res.render('admin/admin_login')
})

router.get('/admin_index',adminAuth.adminLoggedIn,admincontroller.Dashboard)


router.post('/admin_login',admincontroller.adminLogin)
router.get('/users',adminAuth.adminLoggedIn,admincontroller.find_user)
router.get('/products',adminAuth.adminLoggedIn,productcontroller.find_product)
router.get('/add_product_page',adminAuth.adminLoggedIn,productcontroller.add_Product)
router.post('/add_product',upload.array('photo',5),productcontroller.addProduct)
router.get('/redo/:id',admincontroller.redo)
router.get('/undo/:id',admincontroller.undo)
router.get('/category_page',adminAuth.adminLoggedIn,categorycontroller.category_find)
router.get('/add_category',adminAuth.adminLoggedIn,categorycontroller.add_Category)
router.post('/add_category',categorycontroller.add_category)
router.get('/block_user/:id',admincontroller.block_user)
router.get('/unblock_user/:id',admincontroller.unblock_user)
router.get('/update_product/:id',admincontroller.updateProduct)
router.post('/update_product/:id',upload.array('photo',5),admincontroller.updateproduct)
router.post('/search',adminAuth.adminLoggedIn,admincontroller.Search)
router.get('/Search',adminAuth.adminLoggedIn,admincontroller.userSearch)

router.get('/delete_category/:id',categorycontroller.deleteCategory)
router.get('/order-details',adminAuth.adminLoggedIn,ordercontroller.orderData)
router.post('/edit_status/:id',ordercontroller.update_status)

router.get('/orderDetail/:id',ordercontroller.Details)
router.get('/refund/:id',walletcontroller.Refund)
router.get('/coupon',adminAuth.adminLoggedIn,couponcontroller.Coupon)
router.get('/add_coupon_page',adminAuth.adminLoggedIn,couponcontroller.AddCoupon)
router.post('/add_coupon',couponcontroller.addCoupon)
router.get('/deactivateCoupon/:id',couponcontroller.CouponDeactivate)
router.get('/activateCoupon/:id',couponcontroller.CouponActivate)
router.get('/adminlogout',admincontroller.Logout)
router.get('/banner',adminAuth.adminLoggedIn,bannercontroller.Banner)
router.get('/addBanner',bannercontroller.AddBanner)
router.post('/addBanner',upload.array('photo',5),bannercontroller.ADDBanner)
router.get('/activateBanner/:id',bannercontroller.activateBanner)
router.get('/deactivateBanner/:id',bannercontroller.deactivateBanner)
router.post('/bannerUpdate/:id',upload.array('photo',5),bannercontroller.UpdateBanner)
router.get('/salesreport',ordercontroller.SalesReport)
router.post('/adminSalesReportFilter',ordercontroller.FilterbyDates)
router.get('/offer',offercontroller.Offer)
router.get('/addcategoryoffer',offercontroller.CategoryOffer)
router.post('/add_category_offer',offercontroller.categoryoffer)
router.get('/activateoffer/:id',offercontroller.offercategory)
router.get('/deactivateoffer/:id',offercontroller.deoffercategory)


module.exports=router