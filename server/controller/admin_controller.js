const bcrypt=require('bcrypt')
const categorySchema=require('../model/add_category')
const userSchema=require('../model/model')
const productSchema=require('../model/product_model')
const { log } = require('console')

//TO POST IN ADMIN 
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
//find product
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
//to get add product page
exports.add_Product=async(req,res)=>{
    try {
       const data=await categorySchema.find()
       res.render("admin/add_product_page",{data}) 
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error')
    }
}
//to add product
exports.addProduct = async (req, res) => {
    try {
      
      const product = new productSchema({
        name: req.body.name,
        price: req.body.price,
        category_name: req.body.category,
        photo:req.files.map((file)=>file.filename)
      });
      console.log(product);
      await product.save();
      const product_data = await productSchema.find().exec()
      res.render("admin/products", { product_data })
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message || "Some error occurred" });
    }
  }



  //to soft delete the product
  exports.undo=async(req,res)=>{
    const {id}=req.params
    try {
      const product=await productSchema.findByIdAndUpdate(id,{Blocked:true})
      res.redirect('/products')
  
      
    } catch (error) {
      res.status(500).send({message:"Error blocking User"})
    }

  }
  exports.redo=async(req,res)=>{
    const {id}=req.params

    try {
      const product=await productSchema.findByIdAndUpdate(id,{Blocked:false})
     
    
      res.redirect('/products')
  
      
    } catch (error) {
      res.status(500).send({message:"Error in unblocking User"})
    }
    
  }
// exports.deleteproduct=async(req,res)=>{
//   try {
//     const id=req.params.id
//     const result=await
//     productSchema.findByIdAndRemove(id)
//     if(result){
//         //check if user was found and removed
//         res.redirect('/products')
//     }else{
//         res.redirect('/products')
//     }
//   } catch (error) {
//     res.status(500).send(error.message); // Send error response with status code 500
// }

//   }
//to get category page
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

// to get add category page
  exports.add_Category=(req,res)=>{
    res.render('admin/add_category')
  }


// to add category
  exports.add_category=async(req,res)=>{
    try {
      let category=req.body.category
      const existingCategory =await categorySchema.findOne({category:category})
      // console.log(existingCategory)
      if(existingCategory){
        return res.send('<script>alert("Category already exists"); window.location.href = "/category_page";</script>')
      }else{
        console.log(req.body);
        const user=new categorySchema({
            category:req.body.category,
            description:req.body.description
        })
        const data=await user.save()
        res.redirect('category_page')
      }
    } catch (error) {
        console.log(error);
        res.status(500).send({
          message:
            error.message || "Some error occurred while creating a create operation",
        });
        
    }
  }

  //to delete category
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
        const description=await categorySchema.find()
        if(!prod){
            return res.redirect('/products')
        } else {
            return res.render('admin/update_product',{prod,category,description})
        }
    } catch (error) {
        console.log(error);
       return res.redirect('/product')
    }
 }
//to update product
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
          stock:req.body.stock,
          description:req.body.description
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
// to block user
exports.block_user=async(req,res)=>{
  const {id}=req.params
  try {
    const user=await userSchema.findByIdAndUpdate(id,{isBlocked:true})
    res.redirect('/users')

    
  } catch (error) {
    res.status(500).send({message:"Error blocking User"})
  }
}
//to unblock user
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

exports.Search = async (req, res) => {
  try {
    let char =  req.body.search;
    console.log(char);
    let product_data = await productSchema.find({
      $or: [
        { name: { $regex: char, $options: 'i' } },
        { category_name: { $regex: char, $options: 'i' } }
      ]
    }).exec();

    if (product_data.length === 0) {
      // Handle case when no search results are found
      res.render("admin/products", { product_data, message: "No search results found." });
    } else {
      res.render("admin/products", { product_data });
    }
  } catch (error) {
    console.error(error);
    res.redirect('/products');
  }
};

exports.userSearch = async (req, res) => {
  try {
    let char = req.query.query; // Use req.query to access the search query parameter because i have chosen get method
    console.log(char);
    let user_data = await userSchema.find({
      $or: [
        { name: { $regex: char, $options: 'i' } },
        { email: { $regex: char, $options: 'i' } },
    
      ]
    }).exec();

    if (user_data.length === 0) {
      // Handle case when no search results are found
      res.render("admin/users", { user_data, message: "No search results found." });
    } else {
      res.render("admin/users", { user_data });
    }
  } catch (error) {
    console.error(error);
    res.redirect('/users');
  }
};

