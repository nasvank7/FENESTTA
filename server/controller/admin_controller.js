const bcrypt = require("bcrypt");
const categorySchema = require("../model/add_category");
const userSchema = require("../model/model");
const productSchema = require("../model/product_model");
const couponSchema=require("../model/coupon")
const orderSchema = require("../model/order");
const walletSchema=require('../model/wallet')
const bannerSchema=require('../model/banner')
const { log } = require("console");
const { orderDetail } = require("./user_controller");
const session = require("express-session");
//TO POST IN ADMIN
exports.adminLogin = (req, res) => {
 
 

  try {
    req.session.admin=true
    const email = req.body.email;
    const password = req.body.password;
    if (email == "admin@gmail.com") {
      if (password == 1234) {
        res.redirect("/admin_index");
      } else {
        res.render("admin/admin_login", { alert: "Invalid password" });
      }
    } else {
      res.render("admin/admin_login", { message: "Invalid Email" });
    }
  } catch (error) {
    console.log(error);
    res.send("An error occured while Logging in");
  }
};

exports.Dashboard = async (req, res) => {
  const admin=req.session.admin
  const today = new Date().toISOString().split("T")[0];
  const startOfDay = new Date(today);
  const endOfDay = new Date(today);
  endOfDay.setDate(endOfDay.getDate() + 1);
  endOfDay.setMilliseconds(endOfDay.getMilliseconds() - 1);

  const todaySales = await orderSchema
    .countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      status: "Delivered",
    })
    .exec();
  console.log(todaySales);

  const totalsales = await orderSchema.countDocuments({ status: "Delivered" });

  const todayRevenue = await orderSchema.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        status: "Delivered",
      },
    },
    { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
  ]);

  const revenue = todayRevenue.length > 0 ? todayRevenue[0].totalRevenue : 0;

  const TotalRevenue = await orderSchema.aggregate([
    {
      $match: { status: "Delivered" },
    },
    { $group: { _id: null, Revenue: { $sum: "$total" } } },
  ]);

  const Revenue = TotalRevenue.length > 0 ? TotalRevenue[0].Revenue : 0;

  const Orderpending = await orderSchema.countDocuments({ status: "Pending" });
  const Orderprocessing = await orderSchema.countDocuments({
    status: "Processing",
  });
  const Ordershipped = await orderSchema.countDocuments({ status: "Shipped" });

  const Ordercancelled = await orderSchema.countDocuments({
    status: "cancelled",
  });

  const salesCountByMonth = await orderSchema.aggregate([
    {
      $match: {
        status: "Delivered",
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id.month",
        year: "$_id.year",
        count: 1,
      },
    },
  ]);

  console.log(salesCountByMonth);

  res.render("admin/admin_index", {
    admin,
    todaySales,
    totalsales,
    revenue,
    Revenue,
    Orderpending,
    Orderprocessing,
    Ordershipped,
    Ordercancelled,
    salesCountByMonth,
  },);
};

//find product
exports.find_product = async (req, res) => {
  try {
    const admin=req.session.admin
    const product_data = await productSchema.find().exec();
    res.render("admin/products", { admin,product_data });
  } catch (error) {
    console.log(error);
    res.send({ message: error.message });
  }
};
//find user
exports.find_user = async (req, res) => {
  try {
    const admin=req.session.admin
    const user_data = await userSchema.find().exec();
    res.render("admin/users", {admin, user_data: user_data });
  } catch (error) {
    console.log(error);
    res.send({ message: error.message });
  }
};
//to get add product page
exports.add_Product = async (req, res) => {
  try {
    const admin=req.session.admin
    const data = await categorySchema.find();
    res.render("admin/add_product_page", { admin,data });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};
//to add product
exports.addProduct = async (req, res) => {
  try {
    const product = new productSchema({
      name: req.body.name,
      price: req.body.price,
      category_name: req.body.category,
      stock: req.body.stock,
      photo: req.files.map((file) => file.filename),
    });
    console.log(product);
    await product.save();
    const product_data = await productSchema.find().exec();
    res.render("admin/products", { product_data });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message || "Some error occurred" });
  }
};

//to soft delete the product
exports.undo = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productSchema.findByIdAndUpdate(id, {
      Blocked: false,
    });
    res.redirect("/products");
  } catch (error) {
    res.status(500).send({ message: "Error blocking User" });
  }
};
exports.redo = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id,'redo');
    const product = await productSchema.findByIdAndUpdate(id, {
      Blocked: true,
    });


    res.redirect("/products");
  } catch (error) {
    res.status(500).send({ message: "Error in unblocking User" });
  }
};
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

exports.category_find = async (req, res) => {
  const admin=req.session.admin
  categorySchema
    .find()
    .then((category_find) => {
      res.render("admin/category_page", {admin, category_find });
    })

    .catch((error) => {
      console.log(error);
      res.status(500).send("Server Error");
    });
};

// to get add category page
exports.add_Category = (req, res) => {
  const admin=req.session.admin
  res.render("admin/add_category",{admin});
};

// to add category
exports.add_category = async (req, res) => {
  try {
    let category = req.body.category;
    const existingCategory = await categorySchema.findOne({
      category: { $regex: new RegExp(`^${category}$`, 'i') },
    });
  
    if (existingCategory) {
      return res.send(
        '<script>alert("Category already exists"); window.location.href = "/category_page";</script>'
      );
    } else {
      console.log(req.body);
      const user = new categorySchema({
        category: req.body.category,
        description: req.body.description,
      });
      const data = await user.save();
      res.redirect("category_page");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message:
        error.message ||
        "Some error occurred while creating a create operation",
    });
  }
  
  }


//to delete category
exports.deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await categorySchema.findByIdAndRemove(id);
    if (result) {
      res.redirect("/category_page");
    } else {
      res.redirect("/category_page");
    }
  } catch (error) {
    console.log(error);
    res.send("some error occured");
  }
};

//edit product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const prod = await productSchema.findById(id);
    const category = await categorySchema.find();
    const description = await categorySchema.find();
    if (!prod) {
      return res.redirect("/products");
    } else {
      return res.render("admin/update_product", {
        prod,
        category,
        description,
      });
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/product");
  }
};
//to update product
exports.updateproduct = async (req, res) => {
  try {
    const  id  = req.params.id
    // let new_image = "";
    // if (req.file) {
    //   new_image = req.file.filename;
    //   try {
    //     fs.unlinkSync("./uploads/" + req.body.photo);
    //   } catch (error) {
    //     console.log(error);
    //   }
    // } else {
    //   new_image = req.body.photo;
    // }
    let new_images = [];
    if (req.files && req.files.length > 0) {
      new_images = req.files.map(file => file.filename);

      try {
        if (req.body.photo && Array.isArray(req.body.photo)) {
          req.body.photo.forEach((photo) => {
            fs.unlinkSync("./uploads/" + photo);
          });
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      new_images = req.body.photo;
    }

    // Update the product using findByIdAndUpdate
    const updatedProduct = await productSchema.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        price: req.body.price,
        category_name: req.body.category,
        photo: new_images,
        stock: req.body.stock,
        description: req.body.description,
      },

      { new: true }
    );

    console.log(updatedProduct,'///////////////////////////////////////////////////')

    // Set { new: true } to return the updated document

    if (updatedProduct) {
      req.session.message = {
        type: "success",
        message: "User update successful",
      };
      req.session.authorized = true;
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
};
// to block user
exports.unblock_user = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userSchema.findByIdAndUpdate(id, { isBlocked: false });
    res.redirect("/users");
  } catch (error) {
    res.status(500).send({ message: "Error blocking User" });
  }
};
//to unblock user
exports.block_user = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await userSchema.findByIdAndUpdate(id, { isBlocked: true });
    console.log(user);

    res.redirect("/users");
  } catch (error) {
    res.status(500).send({ message: "Error in unblocking User" });
  }
};

exports.Search = async (req, res) => {
  try {
    let char = req.body.search;
    console.log(char);
    let product_data = await productSchema
      .find({
        $or: [
          { name: { $regex: char, $options: "i" } },
          { category_name: { $regex: char, $options: "i" } },
        ],
      })
      .exec();

    if (product_data.length === 0) {
      // Handle case when no search results are found
      res.render("admin/products", {
        product_data,
        message: "No search results found.",
      });
    } else {
      res.render("admin/products", { product_data });
    }
  } catch (error) {
    console.error(error);
    res.redirect("/products");
  }
};

exports.userSearch = async (req, res) => {
  try {
    let char = req.query.query; // Use req.query to access the search query parameter because i have chosen get method
    console.log(char);
    let user_data = await userSchema
      .find({
        $or: [
          { name: { $regex: char, $options: "i" } },
          { email: { $regex: char, $options: "i" } },
        ],
      })
      .exec();

    if (user_data.length === 0) {
      // Handle case when no search results are found
      res.render("admin/users", {
        user_data,
        message: "No search results found.",
      });
    } else {
      res.render("admin/users", { user_data });
    }
  } catch (error) {
    console.error(error);
    res.redirect("/users");
  }
};

exports.orderData = async (req, res) => {
  try {
     const admin=req.session.admin
    const order_data = await orderSchema.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
    ]);
    console.log(order_data);
    res.render("admin/order", { admin,order_data });
  } catch (error) {
    console.log(error);
  }
};

// exports.find_user=async(req,res)=>{
//   try {
//       const user_data=await userSchema.find().exec()
//       res.render('admin/users',{user_data:user_data})
//   } catch (error) {
//       console.log(error);
//       res.send({message:error.message})
//   }
// }
exports.update_status = async (req, res) => {
  try {
    const id = req.params.id;
    const orderStatus = req.body.status;
    const order = await orderSchema.findByIdAndUpdate(
      id,
      {
        status: orderStatus,
      },
      { new: true }
    );
    res.redirect("/order-details");
  } catch (error) {
    console.log(error);
    res.status(501).send("server error");
  }
};

exports.Details = async (req, res) => {
  try {
    const id = req.params.id;
   

    const order = await orderSchema.findById(id).populate("items.product");
 const address=await orderSchema.findById(id).populate('address')

    console.log(order);
  
  console.log(address);
 

    res.render("admin/orderDetails", {  order,address });
  } catch (error) {
    console.log(error);
  }
};

exports.Coupon=async(req,res)=>{
  const admin=req.session.admin
  const coupon=await couponSchema.find().exec()
 
  res.render('admin/coupon',{admin,coupon})
}
exports.AddCoupon=async(req,res)=>{
  const admin=req.session.admin
  res.render("admin/addCoupon",{admin})
}
exports.addCoupon=async(req,res)=>{
  try {
    const code=req.body.code
    const existingCoupon=await couponSchema.findOne({code:code})

    if(existingCoupon){
      console.log('coupon is already existed');

    }
    else{
      const coupon=new couponSchema({
        code:req.body.code,
        date:req.body.date,
        discount:req.body.discount
      })
      console.log(coupon);
      await coupon.save()
      res.redirect('/coupon')
    }
  } catch (error) {
    console.log(error);
  }
    
}
exports.Refund=async(req,res)=>{

    const { id } = req.params;
  
    try {
      const order = await orderSchema.findById(id).populate({ path: "items.product" });
      console.log(order.payment_method);
  
      if (!order) {
        return res.status(404).send({ message: "Order not found" });
      }
  
      const wallet = await walletSchema.findOne({ userId: order.user });
  
      if (wallet) {
        // User's wallet already exists, update the balance
        wallet.balance += order.total;
  
        wallet.transactions.push(order.payment_method);
        console.log(wallet, "hdh");
  
        await wallet.save();
      } else {
        // User's wallet does not exist, create a new wallet
        const newWallet = new walletSchema({
          userId: order.user,
          orderId: order._id,
          balance: order.total,
          transactions: [order.payment_method]
        });
         console.log(newWallet);
        await newWallet.save();
      }
  
      await orderSchema.updateOne({ _id: id }, { $set: { status: 'Refunded Amount' } });
  
      res.redirect('/order-details');
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Internal server error' });
    }
  };

  exports.Logout=(req,res)=>{
    req.session.admin=false
    
    res.redirect('/admin_login')
  }

  exports.CouponDeactivate=async(req,res)=>{
    try {
      const id=req.params.id
      await couponSchema.findByIdAndUpdate(id,{
        status:false
      },{new:true})

     res.redirect('/coupon')
    } catch (error) {
      console.log(error)
    }
  }
  exports.CouponActivate=async(req,res)=>{
    try {
      const id=req.params.id
      await couponSchema.findByIdAndUpdate(id,{
        status:true
      },{new:true})
     
     res.redirect('/coupon')
    } catch (error) {
      console.log(error)
    }
  }

  exports.Banner=async(req,res)=>{
    const admin=req.session.admin
    const Banner_data=await bannerSchema.find().exec()
    res.render('admin/banner',{admin,Banner_data})
  }
  exports.AddBanner=async(req,res)=>{
    const admin=req.session.admin
    res.render('admin/addBanner',{admin})
  }
  exports.ADDBanner=async(req,res)=>{
    try {
      const Banner = new bannerSchema({
        name: req.body.name,
        photo: req.files.map((file) => file.filename),
        date:req.body.date,
      });
      console.log(Banner);
      await Banner.save();
  
      const Banner_data=await bannerSchema.find().exec()
      res.render('admin/banner',{Banner_data})
    } catch (error) {
      console.log(error);
    }
   
  }

  exports.activateBanner=async(req,res)=>{
    try {
      const id=req.params.id
      await bannerSchema.findByIdAndUpdate(id,{
        status:true
      },{new:true})
      res.redirect('/banner')
    } catch (error) {
      console.log(error);
    }
   
  }

  exports.SalesReport=async(req,res)=>{
    const admin=req.session.admin
    const filteredOrders=await orderSchema.find().populate("user").populate("items.product").populate("address")
    res.render("admin/SalesReport",{admin,filteredOrders})
  }

  exports.FilterbyDates=async(req,res)=>{
    const admin=req.session.admin
    const FromDate=req.body.fromdate
    console.log(FromDate);
    const Todate=req.body.todate
    console.log(Todate);
    const filteredOrders=await orderSchema.find({createdAt:{$gte:FromDate,$lte:Todate}}).populate("user").populate("items.product").populate("address")
    console.log('///////////////////////////////////////////////');
    console.log(filteredOrders)
    console.log('///////////////////////////////////////////////');
    res.render("admin/SalesReport",{admin,filteredOrders})
  }