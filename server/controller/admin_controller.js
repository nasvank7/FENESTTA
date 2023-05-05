const bcrypt=require('bcrypt')
const categorySchema=require('../model/add_category')
const userSchema=require('../model/model')
const productSchema=require('../model/product_model')
const { log } = require('console')


exports.adminLogin=(req,res)=>{
    console.log(req.body);
    const email=req.body.email
    const password=req.body.password

    try {
        if(email=='admin@gmail.com'){
            if(password==1234){
                res.redirect('/admin_index')
            }else{
                res.render('admin/admin_login',{alert:"Invalid password"})
            }
        }else{
            res.render('admin/admin_login',{message:'Invalid Email'})
        }

    } catch (error) {
        console.log(error);
        res.send("An error occured while Logging in")
        
    }
}
//find
exports.find_product=async(req,res)=>{
    try {
        const product_data=await productSchema.find().exec()
        res.render('admin/products',{product_data})
    } catch (error) {
        console.log(error);
        res.send({message:error.message})
    }
}
//find user
exports.find_user=async(req,res)=>{
    try {
        const user_data=await userSchema.find().exec()
        res.render('admin/users',{user_data:user_data})
    } catch (error) {
        console.log(error);
        res.send({message:error.message})
    }
}
exports.add_Product=async(req,res)=>{
    try {
       const data=await categorySchema.find()
       res.render("admin/add_product_page",{data}) 
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error')
    }
}

exports.addProduct = async (req, res) => {
    try {
        console.log(req.body,req.file);
      const product = new productSchema({
        name: req.body.name,
        price: req.body.price,
        category_name: req.body.category,
        photo:req.file.filename
      });
      await product.save();
      const product_data = await productSchema.find().exec()
      res.render("admin/products", { product_data })
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message || "Some error occurred" });
    }
  }
exports.deleteproduct=async(req,res)=>{
  try {
    const id=req.params.id
    const result=await
    productSchema.findByIdAndRemove(id)
    if(result){
        //check if user was found and removed
        res.redirect('/products')
    }else{
        res.redirect('/products')
    }
  } catch (error) {
    res.status(500).send(error.message); // Send error response with status code 500
}

  }

  exports.category_find=async(req,res)=>{
     categorySchema
     .find()
     .then((category_find)=>{
        res.render('admin/category_page',{category_find})
     })

   .catch ((error)=> {
        console.log(error);
        res.status(500).send('Server Error')
    })
  }


  exports.add_Category=(req,res)=>{
    res.render('admin/add_category')
  }



  exports.add_category=async(req,res)=>{
    try {
        console.log(req.body);
        const user=new categorySchema({
            category:req.body.category,
            description:req.body.description
        })
        const data=await user.save()
        res.redirect('category_page')
    } catch (error) {
        console.log(error);
        res.status(500).send({
          message:
            error.message || "Some error occurred while creating a create operation",
        });
        
    }
  }
 exports.deleteCategory=async(req,res)=>{
    try {
        const id=req.params.id
        const result=await
        categorySchema.findByIdAndRemove(id)
        if(result){
            res.redirect('/category_page')
        }else{
            res.redirect('/category_page')

        }
    } catch (error) {
        console.log(error)
        res.send("some error occured")
    }
 }

//edit product
 exports.updateProduct=async(req,res)=>{
    try {
        const {id}=req.params

        const prod=await productSchema.findById(id)
        const category=await categorySchema.find()
        if(!prod){
            return res.redirect('/products')
        } else {
            return res.render('admin/update_product',{prod,category})
        }
    } catch (error) {
        console.log(error);
       return res.redirect('/product')
    }
 }
//
exports.updateproduct=async(req,res)=>{
    try {
        const {id}=req.params
        let new_image=""
        if (req.file) {
            new_image = req.file.filename;
            try {
              fs.unlinkSync("./uploads/" + req.body.photo);
            } catch (error) {
              console.log(error);
            }
          } else {
            new_image = req.body.photo;
          }

          // Update the product using findByIdAndUpdate
    const updatedProduct = await productSchema.findByIdAndUpdate(
        id,
        {
          name: req.body.name,
          price: req.body.price,
          category_name: req.body.category,
          photo: new_image,
        },
       
        { new: true }
        
      );
      
      // Set { new: true } to return the updated document
  
      if (updatedProduct) {
        req.session.message = {
          type: "success",
          message: "User update successful",
        };
        req.session.authorized=true
        res.redirect("/products");
      } else {
        // Product not found
        req.session.message = {
          type: "error",
          message: "Product not found",
        };
        res.redirect("/products");
      }
    } catch (error) {
      console.error(error);
      res.send(error);
    }
  }
// router.get('/logout',(req,res)=>{
exports.block_user=async(req,res)=>{
  const {id}=req.params
  try {
    const user=await userSchema.findByIdAndUpdate(id,{isBlocked:true})
    res.redirect('/users')

    
  } catch (error) {
    res.status(500).send({message:"Error blocking User"})
  }
}
exports.unblock_user=async(req,res)=>{
  const {id}=req.params

  try {
    const user=await userSchema.findByIdAndUpdate(id,{isBlocked:false})
    console.log(user);
  
    res.redirect('/users')

    
  } catch (error) {
    res.status(500).send({message:"Error in unblocking User"})
  }
}