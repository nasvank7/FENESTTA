require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICESID;
const client = require("twilio")(accountSid, authToken);
const paypal = require("paypal-rest-sdk");

const paypalClientId = process.env.PaypalClientId;
const paypalSecret = process.env.paypalSecret;

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: paypalClientId,
  client_secret: paypalSecret,
});

// console.log(JSON.stringify(paypal.configure.), "vanuuu tttaaaaaaaaaaaaaaa");

const bcrypt = require("bcrypt");
const userSchema = require("../model/model");
const productSchema = require("../model/product_model");
const CartSchema = require("../model/cart");
const AddressSchema = require("../model/address");
const couponSchema=require('../model/coupon')
const orderSchema = require("../model/order");
const walletSchema=require('../model/wallet')
const bannerSchema=require('../model/banner')
const session = require("express-session");
const fs = require("fs");
const bodyparser = require("body-parser");
let paypaltotal = 0;
const { homedir } = require("os");
const { ObjectId } = require("mongodb-legacy");
const { log } = require("console");
const { Error } = require("mongoose");
//to get index
exports.index = async (req, res) => {
  const product = await productSchema.find();
  const bestseller = product.slice(0, 3);
  const banner=await bannerSchema.find()
  let user = req.session.user;
  res.render("user/index", { bestseller, user,banner });
};
// to get homed
exports.Home = async (req, res) => {
  const product = await productSchema.find();
  const bestseller = product.slice(0, 2);
  console.log(product);
  const banner=await bannerSchema.find()

  let user = req.session.user;
  res.render("user/index", { user, bestseller,banner });
};
//to get login
exports.getLogin = (req, res) => {
  const user = req.session.user;
  res.render("user/login", { user, message: req.session.message });
};
//to get signup
exports.dosignup = (req, res) => {
  const user = req.session.user;
  res.render("user/signup", { user });
};
// to post in this.doSignup
exports.doSignup = async (req, res) => {
  try {
    const user=req.session.user
    const existingUser = await userSchema.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }],
    });

    if (existingUser) {
      // User with given email or phone already exists
      res.render("user/signup", {
        user,
        msg: "EMAIL OR PHONE NUMBER IS ALREADY IN USE",
      });
    } else {
      const saltRounds = 10;
      const hash = await bcrypt.hash(req.body.password, saltRounds);

      const user = new userSchema({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: hash,
      });

      await user.save();
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
    // res.send({ message: "Error occurred while registering" });
  }
};

//to post in login
exports.dologin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await userSchema.findOne({ email: email });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        if (user.isBlocked) {
          // res.render("user/login", {
          //   user,
          //   msg: "user cant be login plz contact admin",
          // });
          req.session.message="user cant be login plz contact admin"
          res.redirect('/login')
        } else {
          req.session.user = user;
          res.redirect("/");
        }
        console.log(req.session.user);
      } else {
        req.session.message = "Invalid Email or Password";
        res.redirect("/login");
      }
    } else {
      res.render("user/login", { user, message: "Invalid Email or Password" });
    }
  } catch (error) {
    console.log(error);
    res.send("An error occurred while logging in");
  }
};
//to logout
exports.logout = (req, res) => {
  req.session.user = false;
  req.session.destroy();
  res.redirect("/");
};
//to get product
exports.product_list = async (req, res) => {


  try {
    const pageSize = 3;
    const currentPage = parseInt(req.query.page) || 1;
    const totalProducts = await productSchema.countDocuments();
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    const product = await productSchema.find().skip(skip).limit(pageSize);
    const user = req.session.user;

    res.render("user/shop", { product, totalPages, currentPage, user });
  } catch (error) {
    console.error("Error fetching products:", error);
  }
};

exports.newArrival = async (req, res) => {
  const product = await productSchema.find();
  const newarrival = product.slice(Math.max(product.length - 2, 0));
  const user = req.session.user;
  res.render("user/newarrival", { user, newarrival });
};

//to get single product page
exports.single_product = async (req, res) => {
  const { id } = req.params;
  const product = await productSchema.findById(id);
  const user = req.session.user;
  console.log(product);
  res.render("user/single-product", { product, user });
};
//to get otp oage
exports.getlogin_otp = (req, res) => {
  const user = req.session.user;
  res.render("user/login-otp", { user });
};
//to send otp
exports.sendotp = async (req, res) => {
  const user = req.session.user;
  const phone = req.body.phone;
  const existingUser = await userSchema.findOne({ phone: phone });
  if (!existingUser) {
    return res.render("user/login-otp", { user });
  }
  req.session.phone = phone;

  try {
    const user = req.session.user;
    const otpResponse = await client.verify.v2
      .services(serviceId)

      .verifications.create({
        to: "+91" + phone,
        channel: "sms",
      });
    res.render("user/login-otp", { user, message: "otp send successfully" });
  } catch (error) {
    res
      .status(error?.status || 400)
      .send(error?.message || "Something went wrong!");
  }
};
//verify OTP
exports.verifyotp = async (req, res) => {
  const verificationCode = req.body.otp;
  const phoneNumber = req.session.phone;

  if (!phoneNumber) {
    res.status(400).send({ message: "Phone number is required" });
    return;
  }

  try {
    const verification_check = await client.verify.v2
      .services(serviceId)
      .verificationChecks.create({
        to: "+91" + phoneNumber,
        code: verificationCode,
      });
    const user = await userSchema.findOne({ phone: phoneNumber });
    const username = user.name;
    const userId = user._id;

    if (verification_check.status === "approved") {
      req.session.user = user;
      res.redirect("/");
    } else {
      res.render("admin/login-otp", { message: "Invalid verification code" });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while verifying the code",
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    let userId = req.session.user?._id;
    let user = req.session.user;
    let cart = await CartSchema.findOne({ user: userId }).populate(
      "products.productId"
    );
    if (cart) {
      let products = cart.products;
      let cartId = cart._id;
      res.render("user/cart", { user, products, userId });
    } else {
      res.render("user/emptyCart", { user });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing your request.");
  }
};
exports.addtocart = async (req, res) => {
  try {

    const userId = req.session.user?._id;
    const productId = req.params.id;

    let userCart = await CartSchema.findOne({ user: userId });

    if (!userCart) {
      const newCart = new CartSchema({ user: userId, products: [] });
      await newCart.save();
      userCart = newCart;
    }

    const productIndex = userCart?.products.findIndex(
      (product) => product.productId == productId
    );

    if (productIndex === -1) {
      userCart.products.push({ productId, quantity: 1 });
    } else {
      userCart.products[productIndex].quantity += 1;
    }

    await userCart.save();

    res.json({message:"product is added to the cart"})
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateQuantity = async (req, res, next) => {
  const userId = req.session.user?._id;
  const cartItemId = req.body.cartItemId;

  try {
    const cart = await CartSchema.findOne({ user: userId }).populate(
      "products.productId"
    );
    

    const cartIndex = cart.products.findIndex((item) =>
      item.productId.equals(cartItemId)
    );
   
    if (cartIndex === -1) {
      return res.json({ success: false, message: "Cart item not found." });
    }

    cart.products[cartIndex].quantity += 1;
    const products = cart.products[cartIndex].productId;
    const maxQuantity = products.stock;
    console.log(maxQuantity,"/////////////");

    if (cart.products[cartIndex].quantity > maxQuantity) {
      return res.json({
        success: false,
        message: "Maximum quantity reached.",
        maxQuantity
      });
    }

    await cart.save();

   
    const total =
      cart.products[cartIndex].quantity *
      cart.products[cartIndex].productId.price;
    const quantity = cart.products[cartIndex].quantity;
  

    res.json({
      success: true,
      message: "Quantity updated successfully.",
      total,
      quantity,
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to update quantity." });
  }
};
exports.decrementQuantity = async (req, res, next) => {
  const userId = req.session.user?._id;
  const cartItemId = req.body.cartItemId;
  console.log("456");
  console.log(userId);
  console.log("123");

  try {
    const cart = await CartSchema.findOne({ user: userId }).populate(
      "products.productId"
    );
    console.log(cart, cartItemId);
    console.log(",jsdvfksjd");

    const cartIndex = cart.products.findIndex((item) =>
      item.productId.equals(cartItemId)
    );
    console.log(cartIndex);
    console.log("xdjfb");
    if (cartIndex === -1) {
      return res.json({ success: false, message: "Cart item not found." });
    }

    cart.products[cartIndex].quantity -= 1;
    await cart.save();

    const total =
      cart.products[cartIndex].quantity *
      cart.products[cartIndex].productId.price;
    const quantity = cart.products[cartIndex].quantity;
    console.log(total);
    console.log(quantity);

    res.json({
      success: true,
      message: "Quantity updated successfully.",
      total,
      quantity,
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to update quantity." });
  }

}

exports.productRemove = async (req, res) => {

  try {
    let { productId } = req.body;
    let userId = req.session.user?._id;
    const userProduct = await productSchema.findById(productId).select("price");
    console.log(userProduct);
    if (!userProduct) {
      res.send({ message: "product not found" });
    }
    const userCart = await CartSchema.findOne({ user: userId });
    
    const productCount = userCart.products.length - 1;
    if (userCart) {
      const itemIndex = userCart.products.findIndex((item) =>
        item.productId.equals(productId)
      );

      if (itemIndex > -1) {
        userCart.products.splice(itemIndex, 1);
        await userCart.save();
        
        res.json({
          status: true,
          message: "product removed from cart",
          length: productCount,
        });
      } else {
        res.json({ status: false, message: "product not found" });
      }
    } else {
      res.json({ status: false, message: "cart not found" });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.checkOut = async (req, res) => {
  let user = req.session.user;
  try {
    const userCoupon=await userSchema.find()
    console.log(userCoupon);
    const addressofdelivery = await userSchema.findOne({ _id: user });

    
    res.render("user/addresspage", {
      user,
      addressofdelivery: addressofdelivery.address,
      
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("server error");
  }
};

exports.Addaddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const { name, Address, phone, zip, city, state } = req.body;

    const user = await userSchema.findOne({ _id: userId });
    console.log(user);
    if (!user) {
      res.status(404).send("User not found.");
      return;
    }
    // Push the new address data to the existing address array

    user.address.push({ name, Address, phone, zip, city, state });

    await user.save();
    res.redirect("/address");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error finding/updating user.");
  }
};

exports.Checkout = async (req, res) => {
  try {
    let id = req.params.id;
    let userId = req.session.user?._id;
    let user = req.session.user;

    let users = await userSchema.findOne(
      { _id: userId },
      { address: { $elemMatch: { _id: id } } }
    );
    console.log(user);
    // console.log(address);

    let cart = await CartSchema.findOne({ user }).populate(
      "products.productId"
    );
    const coupon=await couponSchema.find()
    if (users) {
      const address = users.address[0];

      res.render("user/checkout", { user, users, cart, address,coupon });
    } else {
      res.status(404).send("Address not found");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};
exports.getHoodies = async (req, res) => {
  const pageSize = 3;
  const currentPage = parseInt(req.query.page) || 1;
  try {
    let user = req.session.user;
    let userId = req.session.user?._id;
    const totalProducts = await productSchema.countDocuments({ Blocked: true });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    let product = await productSchema.find({ category_name: "HOODIES" });
    console.log(product);
    res.render("user/shop", { user, product,currentPage,totalPages})
  } catch (error) {
    console.log("error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.getShirts = async (req, res) => {
  const pageSize = 3;
  const currentPage = parseInt(req.query.page) || 1;
  try {
    let user = req.session.user;
    let userId = req.session.user?._id;
    const totalProducts = await productSchema.countDocuments({ Blocked: true });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    let product = await productSchema.find({ category_name: "SHIRT" }).skip(skip).limit(pageSize)
    res.render("user/shop", { user, product,currentPage,totalPages})
  } catch (error) {
    console.log("error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.getTshirts = async (req, res) => {
  const pageSize = 3;
  const currentPage = parseInt(req.query.page) || 1;
  try {
    let user = req.session.user;
    let userId = req.session.user?._id;
    const totalProducts = await productSchema.countDocuments({ Blocked: true });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    let product = await productSchema.find({ category_name: "T SHIRT" }).skip(skip).limit(pageSize)
    res.render("user/shop", { user, product,currentPage,totalPages})
  } catch (error) {
    console.log("error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



exports.orderConfirmation = async (req, res) => {
  try {
    const id = req.params.id;
    let user = req.session.user;
    const userId = req.session.user?._id;
    const payment = req.body.payment_method;

    try {
      let address = await userSchema.findOne(
        { _id: userId },
        { address: { $elemMatch: { _id: id } } }
      );

      if (!address) {
        throw new Error("Address not found");
      }
    } catch (error) {
      throw new Error("Failed to retrieve address: " + error.message);
    }
    const cart = await CartSchema.findOne({ user: userId }).populate(
      "products.productId"
    );
    const discount=cart.total
    console.log(discount,'lsdbfhdbsh');

    const items = cart.products.map((item) => {
      const product = item.productId;
      const quantity = item.quantity;
      const price = product.price;

      if (!price) {
        throw new Error("Product price is required");
      }
      if (!product) {
        throw new Error("Product is required");
      }

      return {
        product: product._id,
        quantity: quantity,
        price: price,
      };
    });
  
    let totalPrice = 0;
    items.forEach((item) => {
      totalPrice += item.price * item.quantity;
    });
    let address = await userSchema.findOne(
      { _id: userId },
      { address: { $elemMatch: { _id: id } } }
    );
    if (discount) {
      totalPrice -= discount;
    }

    if (req.query.couponValue) {
      const couponValue = parseFloat(req.query.couponValue);
      if (!isNaN(couponValue)) {
        totalPrice -= couponValue;
      }
    }

    if (payment === "cashondelivery") {
      const order = new orderSchema({
        user: userId,
        items: items,
        total: totalPrice,
        status: "Pending",
        payment_method: payment,
        createdAt: new Date(),

        address: address,
      });
      await order.save();
      await cart.products.map(async (item) => {
        let Stock = item.productId.stock - item.quantity;
  
        await productSchema.findByIdAndUpdate(
          item.productId._id,
          {
            stock: Stock,
          },
          { new: true }
        );
      })
      await CartSchema.deleteOne({ user: userId });
      res.render("user/orderConfirmation", { user, userId });
    } else if (payment === "paypal") {
      const order = new orderSchema({
        user: userId,
        items: items,
        total: totalPrice,
        status: "Pending",
        payment_method: payment,
        createdAt: new Date(),

        address: address,
      });
      await order.save();

      const total = order.total;
      paypaltotal = order.total;

      let createPayment = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: "http://localhost:3000/paypal-success",
          cancel_url: "http://localhost:3000/paypal-err",
        },
        transactions: [
          {
            amount: {
              currency: "USD",
              total: `${total}`,
            },
            description: "Super User Paypal Payment",
          },
        ],
      };

      paypal.payment.create(createPayment, (error, payment) => {
        if (payment) {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              res.redirect(payment.links[i].href);
            }
          }
        } else {
          console.log(error);
          throw error;
        }
      });
      await CartSchema.deleteOne({ user: userId });
    }
  } catch (error) {
    console.log(error);
  }
};

exports.paypalSuccess = (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const user = req.session.user;
  const userId = req.session.user?._id;
  const total = paypaltotal;
  console.log(total);

  console.log(payerId, "asassasas");
  console.log(paymentId);

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: `${total}`,
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        throw error;
      } else {
        const user = req.session.user;
        res.render("user/paypal-success", { payment, user, userId });
      }
    }
  );
};

exports.hightolow = async (req, res) => {
  console.log("jdhvkdvshhbfvsdhbc");
};

exports.orderDetail = async (req, res) => {
  try {
    let user = req.session.user;
    const userId = req.session.user?._id;
    const orderData = await orderSchema
      .find({ user: userId })
      .populate("items.product");
    console.log(orderData);

    res.render("user/orderDetails", { orderData, user });
  } catch (error) {
    console.log(error);
  }
};



exports.userProfile = async (req, res) => {
  const user = req.session.user;

  console.log(user);

  const userData = await userSchema.findOne(user).populate("address");
  console.log(userData);
  res.render("user/userProfile", { user, userData });
};

exports.updateProfile = async (req, res) => {
  const user = req.session.user;
  res.render("user/updateProfile", { user });
};

exports.UpdateProfile=async(req,res)=>{
  try {
    // let user=req.session.user
    const userId=req.session.user?._id
    console.log(userId);
    const userData= await userSchema.findByIdAndUpdate(userId,{
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            

    },{new:true})
    const user=req.session.user=userData
     res.render('user/userProfile',{user,userData})
  } catch (error) {
    console.log(error,'jhvsnvsdv');
  }

}
exports.updatePassword=async(req,res)=>{
  
}

exports.Cancelorder = async (req, res) => {
  try {
    const id = req.params.id;
  

    await orderSchema.findByIdAndUpdate(id,{
      reason:req.body.reason
    })

    const cancel_product = await orderSchema.findByIdAndUpdate(
      id,
      {
        status: "cancelled",
      },
      { new: true }
    );
    console.log(cancel_product);
if(cancel_product){
  res.redirect('/orderDetails')
}


  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: "An error occurred while canceling the order.",
    });
  }
};


exports.Returnorder = async (req, res) => {
  try {
    const id = req.params.id

    await orderSchema.findByIdAndUpdate(id,{
      reason:req.body.reason
    })
    const return_data = await orderSchema.findByIdAndUpdate(
      id,
      {
        status: "Returned",
      },
      { new: true }
    );
    console.log(return_data);
    if (return_data){
      res.redirect('/orderDetails')
    }

  
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      error: "An error occurred while canceling the order.",
    });
  }
};




exports.OrderView = async (req, res) => {
  try {
    const id = req.params.id;
    const user = req.session.user;

    const order = await orderSchema.findById({_id:id}).populate("user").populate("items.product")
 const address=await orderSchema.findById({_id:id}).populate('address')
console.log('//////////////');
    console.log(order);
    console.log('//////////////');
  console.log(address);
 

    res.render("user/orderView", { user, order,address });
  } catch (error) {
    console.log(error);
  }
};

exports.LowToHigh = async (req, res) => {
  const pageSize = 3;
  const currentPage = parseInt(req.query.page) || 1;
  try {
    const user = req.session.user;
    const user_id = req.session.user_id;
    const totalProducts = await productSchema.countDocuments({ Blocked: true });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    const product = await productSchema.find({ Blocked: true }).sort({ price: 1 }).skip(skip).limit(pageSize);
    res.render("user/shop", { product, user,user_id,totalPages,currentPage,});
  } catch (error) {
    console.error("Error fetching products:", error);
    res.render("error", { message: "Error fetching products" });
  }
};

exports.HighToLow = async (req, res) => {
  const pageSize = 3;
  const currentPage = parseInt(req.query.page) || 1;

  try {
    const user = req.session.user;
    const user_id = req.session.user_id;
    const totalProducts = await productSchema.countDocuments({ Blocked: true });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    const product = await productSchema.find({ Blocked: true }).sort({ price: -1 }).skip(skip).limit(pageSize);
    res.render("user/shop", { product, user, user_id,totalPages,currentPage });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.render("error", { message: "Error fetching products" });
  }
};

exports.searchProducts = async (req, res) => {
  const pageSize = 4;
  const currentPage = parseInt(req.query.page) || 1;
 try {
    const user = req.session.user;
    const query = req.body.query;
    console.log(query);
    const totalProducts = await productSchema.countDocuments({
      name: { $regex: new RegExp(query, "i") },
    });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    const product = await productSchema.find({ name: { $regex: new RegExp(query, "i") } }).skip(skip).limit(pageSize);

  res.render("user/shop", { product, user, totalPages, currentPage });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.Forgotpage=(req,res)=>{
  res.render('user/forgot-password')
}

exports.SendOTP=async(req,res)=>{
  const user = req.session.user;
  const phone = req.body.phone;
  const existingUser = await userSchema.findOne({ phone: phone });
  if (!existingUser) {
    return res.render("user/login-otp", { user });
  }
  req.session.phone = phone;

  try {
    const user = req.session.user;
    const otpResponse = await client.verify.v2
      .services(serviceId)

      .verifications.create({
        to: "+91" + phone,
        channel: "sms",
      });
    res.render("user/verifyForgot", { user, message: "otp send successfully" });
  } catch (error) {
    res
      .status(error?.status || 400)
      .send(error?.message || "Something went wrong!");
  }
}
exports.verifyForget=async(req,res)=>{
  const verificationCode = req.body.otp;
  const phoneNumber = req.session.phone;

  if (!phoneNumber) {
    res.status(400).send({ message: "Phone number is required" });
    return;
  }

  try {
    const verification_check = await client.verify.v2
      .services(serviceId)
      .verificationChecks.create({
        to: "+91" + phoneNumber,
        code: verificationCode,
      });
    const user = await userSchema.findOne({ phone: phoneNumber });
    const username = user.name;
    const userId = user._id;

    if (verification_check.status === "approved") {
      req.session.user = user;
      res.render("user/setNewPassword");
    } else {
      res.render("user/forgot-password", { message: "Invalid verification code" });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while verifying the code",
    });
  }
}

exports.forgot_password = async (req, res) => {

  const phoneNumber = req.session.phone;
  const password = req.body.password;
 
  console.log(phoneNumber, "**)(");


  try {

    userSchema.findOne({ phone: phoneNumber }).then((user) => {
      const saltRounds = 10;
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          res.status(500).send({
            message:
              err.message || "Some error occurred while hashing the password",
          });
        } else {
          userSchema
            .findOneAndUpdate(
              { phone: phoneNumber },
              { password: hash },
              { useFindAndModify: false }
            )
            .then((data) => {
              if (!data) {
                res
                  .status(404)
                  .send({
                    message: `Cannot update user with ID: ${phone}. User not found.`,
                  });
              } else {
                res.render("user/login", {
                  message: "Successfully updated password",
                });
              }
            })
            .catch((err) => {
              res
                .status(500)
                .send({ message: "Error updating user information" });
            });
        }
      });
    });
  } catch (err) {
    res
      .status(500)
      .send({
        message: err.message || "Some error occurred while verifying the code",
      });
  }
  }

;
exports.UserAdressess=async(req,res)=>{
  const user=req.session.user
 

  const userWithAddresses = await userSchema.findOne(user).populate("address");
  console.log(userWithAddresses);
  const addresses = userWithAddresses.address;
  console.log(addresses);
  
  res.render('user/userAddresses',{user,addresses})
}


exports.UserOrder=async(req,res)=>{
  try {
    let user = req.session.user;
    const userId = req.session.user?._id;
    console.log("cgc");
    const orderData = await orderSchema
      .find({ user: userId })
      .populate("items.product");
    console.log(orderData);

    res.render("user/userOrders", { orderData, user });
  } catch (error) {
    console.log(error);
  }
}
exports.redeemCoupon = async (req, res) => {
  const { coupon} = req.body
  console.log(coupon);
  const userId = req.session.user._id;

  const couponFind = await couponSchema.findOne({ code: coupon });
  const userCoupon = await userSchema.findById(userId);
console.log(userCoupon,"user");
  if (userCoupon.coupon.includes(coupon)) {
    return res.json({
      success: false,
      message: 'Coupon Already used'
    });
  }
  console.log('/////////');

  userCoupon.coupon.push(coupon);
  await userCoupon.save();

  if (!couponFind || couponFind.status === false) {
    return res.json({
      success: false,
      message: couponFind ? 'Coupon Deactivated' : 'Coupon not found'
    });
  }

  const currentDate = new Date();
  const expirationDate = new Date(couponFind.date);

  if (currentDate > expirationDate) {
    return res.json({
      success: false,
      message: 'Coupon Expired'
    });
  }

  const amount = couponFind.discount;

  res.json({
    success: true,
    message: 'Coupon available',
    couponFind,
    amount: parseInt(amount)
  });


  try {
    
    const cart = await CartSchema.findOne({user:userId})
    console.log(cart);
  
   
    if (!cart) {
console.log("Cart not found");
      return; // or throw an error
    }
  
    cart.total = amount;

    await cart.save();

  } catch (error) {
    console.error("Error updating cart:", error);
    // handle the error appropriately
  }
  

};

exports.Wallet = async (req, res) => {
  const user = req.session.user;
  let sum = 0;

  const walletbalance = await walletSchema.findOne({ userId: user }).populate('orderId');
  const RefundedOrder = await orderSchema.find({ user: user, status: "Refunded Amount" }).populate('items.product');
  console.log(RefundedOrder, "/////////////////////");
  
  if (walletbalance) {
    const items = walletbalance.orderId[0].items;
    sum += walletbalance.balance;
    const wallet = walletbalance.orderId;
    res.render('user/wallet', { user, wallet, sum, walletbalance, RefundedOrder });
  } else {
    res.render('user/wallet', { user, wallet: null, sum, walletbalance: null, RefundedOrder });
  }
};

exports.EditAddress=async(req,res)=>{
  const user=req.session.user
  const userWithAddresses = await userSchema.findOne(user).populate("address");
  console.log(userWithAddresses);
  const addresses = userWithAddresses.address[0]
  console.log('////////////////////////////');
  console.log(addresses);
  console.log('////////////////////////////');
  res.render('user/editAddress',{user,addresses})
}

exports.updateAddress=async(req,res)=>{
  const user=req.session.user
  const id=req.params.id
  console.log(id);
  const userId=req.session.user?._id
  console.log(userId);
  const updatedAddress={
    name:req.body.name,
    Address:req.body.address,
    state: req.body.state,
    city: req.body.city,
    phone: req.body.phone
  }

  const editedAddress=await userSchema.findOneAndUpdate({_id:userId,"address._id":id},{$set:{"address.$":updatedAddress}},{new:true})
  console.log(editedAddress);
  const addresses = editedAddress.address[0]
  res.render("user/userAddresses",{addresses,user})
}

exports.Invoice=async(req,res)=>{
  const user=req.session.user
  const id=req.params.id
  const userOrder=await userSchema.findOne(user)
  console.log(userOrder);
  const order=await orderSchema.findById(id).populate('items.product')
  const address=await orderSchema.findById(id).populate('address')
  console.log(order);
  console.log(address);
  res.render('user/invoice',{user,userOrder,order,address})
}