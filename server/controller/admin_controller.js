const bcrypt = require("bcrypt");
const categorySchema = require("../model/add_category");
const userSchema = require("../model/model");
const productSchema = require("../model/product_model");
const couponSchema = require("../model/coupon");
const orderSchema = require("../model/order");
const walletSchema = require("../model/wallet");
const bannerSchema = require("../model/banner");
const offerSchema = require("../model/offer");
const { log } = require("console");
const { orderDetail } = require("./user_controller");
const session = require("express-session");
//TO POST IN ADMIN
exports.adminLogin = (req, res) => {
  try {
    req.session.admin = true;
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
  try {
    const admin = req.session.admin;
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
    });
  } catch (error) {
    
  }

};

//find product

//find user
exports.find_user = async (req, res) => {
  try {
    const admin = req.session.admin;
    const user_data = await userSchema.find().exec();
    res.render("admin/users", { admin, user_data: user_data });
  } catch (error) {
    console.log(error);
    res.send({ message: error.message });
  }
};
//to get add product page
exports.add_Product = async (req, res) => {
  try {
    const admin = req.session.admin;
    const data = await categorySchema.find();
    res.render("admin/add_product_page", { admin, data });
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
    const product = await productSchema.findByIdAndUpdate(id, {
      Blocked: true,
    });

    res.redirect("/products");
  } catch (error) {
    res.status(500).send({ message: "Error in unblocking User" });
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
    const id = req.params.id;

    let new_images = [];
    if (req.files && req.files.length > 0) {
      new_images = req.files.map((file) => file.filename);

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
   

    res.redirect("/users");
  } catch (error) {
    res.status(500).send({ message: "Error in unblocking User" });
  }
};

exports.Search = async (req, res) => {
  try {
    let char = req.body.search;
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
    let char = req.query.query;

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

exports.Logout = (req, res) => {
  req.session.admin = false;

  res.redirect("/admin_login");
};
