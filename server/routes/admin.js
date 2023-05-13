var express=require('express')
var router=express.Router();
const admincontroller=require('../controller/admin_controller')
const multer=require('multer')
const fs=require('fs')

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
      // Remove spaces and special characters from original filename
      const originalname = file.originalname.replace(/[^a-zA-Z0-9]/g, "");
      // Set filename to fieldname + current date + original filename
      cb(null, `${file.fieldname}_${Date.now()}_${originalname}`);
    },
  });

   const upload= multer({
    storage:storage,
   })


router.get('/admin_login',(req,res)=>{
    res.render('admin/admin_login')
})

router.get('/admin_index',(req,res)=>{
    res.render('admin/admin_index')
})


router.post('/admin_login',admincontroller.adminLogin)
router.get('/users',admincontroller.find_user)
router.get('/products',admincontroller.find_product)
router.get('/add_product_page',admincontroller.add_Product)
router.post('/add_product',upload.array('photo',5),admincontroller.addProduct)
router.get('/redo/:id',admincontroller.redo)
router.get('/undo/:id',admincontroller.undo)
router.get('/category_page',admincontroller.category_find)
router.get('/add_category',admincontroller.add_Category)
router.post('/add_category',admincontroller.add_category)
router.get('/block_user/:id',admincontroller.block_user)
router.get('/unblock_user/:id',admincontroller.unblock_user)
router.get('/update_product/:id',admincontroller.updateProduct)
router.post('/update_product/:id',upload.array('photo',5),admincontroller.updateproduct)
router.post('/search',admincontroller.Search)
router.get('/Search',admincontroller.userSearch)

router.get('/delete_category/:id',admincontroller.deleteCategory)


module.exports=router