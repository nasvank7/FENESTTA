var express=require('express')
var router=express.Router();
const admincontroller=require('../controller/admin_controller')
const multer=require('multer')
const fs=require('fs')

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.filename + '-' + Date.now())
    }
  });
  
  var upload = multer({
    storage: storage,
  }).single("photo");


router.get('/admin_login',(req,res)=>{
    res.render('admin/admin_login')
})

router.get('/admin_index',(req,res)=>{
    res.render('admin/admin_index')
})

router.get('/category',(req,res)=>{
    res.render('admin/category')
})
router.post('/admin_login',admincontroller.adminLogin)
router.get('/users',admincontroller.find_user)
router.get('/products',admincontroller.find_product)
router.get('/add_product_page',admincontroller.add_Product)
router.post('/add_product',upload,admincontroller.addProduct)
router.get('/delete_product/:id',admincontroller.deleteproduct)
router.get('/edit_product')
router.get('/category_page',admincontroller.category_find)
router.get('/add_category',admincontroller.add_Category)
router.post('/add_category',admincontroller.add_category)
router.get('/block_user/:id',admincontroller.block_user)
router.get('/unblock_user/:id',admincontroller.unblock_user)
router.get('/update_product/:id',admincontroller.updateProduct)
router.post('/update_product/:id',upload,admincontroller.updateproduct)

router.get('/delete_category/:id',admincontroller.deleteCategory)


module.exports=router