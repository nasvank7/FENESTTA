require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = "VA72b5cdba229719556327c6fbe8dc3a1e";
const client = require("twilio")(accountSid, authToken);

const bcrypt = require("bcrypt");
const userSchema = require("../model/model");
const productSchema = require("../model/product_model");
const CartSchema=require('../model/cart')
const session = require("express-session");
const fs = require("fs");
const { homedir } = require("os");
//to get index
exports.index = async(req, res) => {
  const product = await productSchema.find().limit(6);
let user=req.session.user
  res.render("user/index", {product,user});
};
// to get homed
exports.Home =async (req, res) => {
  const product = await productSchema.find().limit(6);
  console.log(product);
   
  let user = req.session.user;
  res.render("user/index", { product,user });
};
//to get login
exports.getLogin = (req, res) => {
  res.render("user/login");
};
//to get signup
exports.dosignup = (req, res) => {
  res.render("user/signup");
};
// to post in this.doSignup
exports.doSignup = async (req, res) => {
  try {
    const existingUser = await userSchema.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }]
    });

    if (existingUser) {
      // User with given email or phone already exists
      res.render("user/signup", { msg: "EMAIL OR PHONE NUMBER IS ALREADY IN USE" });

    }else{

      
      const saltRounds = 10;
      const hash = await bcrypt.hash(req.body.password, saltRounds);
      
      const user = new userSchema({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: hash,
      });
      
      await user.save();
      res.render("user/login", { msg: "successfully registered" });
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
          res.render("user/login", {
            msg: "user cant be login plz contact admin",
          });
        } else {
          req.session.user = user;
          res.redirect("/");
        }
        console.log(req.session.user);
      } else {
        res.render("user/login", { message: "Invalid USER" });
      }
    } else {
      res.render("user/login", { message: "Invalid USER" });
    }
  } catch (error) {
    console.log(error);
    res.send("An error occurred while logging in");
  }
};
//to logout
exports.logout = (req, res) => {
  req.session.user=false;
  res.redirect('/')
};
//to get product
exports.product_list = async (req, res) => {
  const product = await productSchema.find().limit(6);
  const user = req.session.user;
  res.render("user/shop", { product, user });
};
//to get single product page
exports.single_product = async (req, res) => {
  const { id } = req.params;
  const product = await productSchema.findById(id);
  const user = req.session.user;
  res.render("user/single-product", { product, user });
};
//to get otp oage
exports.getlogin_otp = (req, res) => {
  res.render("user/login-otp");
};
//to send otp
exports.sendotp = async (req, res) => {
  const phone = req.body.phone;
  const existingUser = await userSchema.findOne({ phone: phone });
  if (!existingUser) {
    return res.render("user/login-otp");
  }
  req.session.phone = phone;
 
  try {
    const otpResponse = await client.verify.v2
      .services(serviceId)

      .verifications.create({
        to: "+91" + phone,
        channel: "sms",
      });
    res.render("user/login-otp", { message: "otp send successfully" });
  } catch (error) {
    res
      .status(error?.status || 400)
      .send(error?.message || "Something went wrong!");
  }
};
//verify OTP
exports.verifyotp = async (req, res) => {
  const verificationCode =req.body.otp;
  const phoneNumber = req.session.phone;
  
  

  if (!phoneNumber) {
    res.status(400).send({ message: "Phone number is required" });
    return;
  }

  try {
    // Verify the SMS code entered by the user
    const verification_check = await client.verify.v2
    .services(serviceId)
    .verificationChecks.create
    ({to: '+91' + phoneNumber, 
    code: verificationCode });
    const user = await userSchema.findOne({ phone:phoneNumber})
    const username = user.name;
    const userId = user._id;


    if (verification_check.status === 'approved') {
      // If the verification is successful, do something
      
      // req.session.isAuth=true;
      // req.session.username = username;
      req.session.user = user;
      res.redirect('/');
    } else {
      // If the verification fails, return an error message
      res.render('admin/login-otp', { message: "Invalid verification code" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message || "Some error occurred while verifying the code" });
}

};

exports.getCart=async(req,res)=>{

  let userId=req.session.user?._id
  let user= req.session.user
  let cart= await CartSchema.findOne({user:userId}).populate(
    "products.productId"
  )
  if (cart) {
    let products=cart.products
    let cartId=cart._id
    res.render('user/cart',{user,products,cartId})
  } else {
    res.render('user/emptyCart',{user})
  }

 

  // res.render('user/cart',{user,products})
}
exports.addtocart = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const productId = req.params.id;

    let userCart = await CartSchema.findOne({ user: userId });

    if (!userCart) {
      // If the user's cart doesn't exist, create a new cart
      const newCart = new CartSchema({ user: userId, products: [] });
      await newCart.save();
       userCart = newCart;
    }

    const productIndex = userCart?.products.findIndex(
      (product) => product.productId == productId
    );

    if (productIndex === -1) {
      // If the product is not in the cart, add it
      userCart.products.push({ productId, quantity: 1 });
    } else {
      // If the product is already in the cart, increase its quantity by 1
      userCart.products[productIndex].quantity += 1;
    }
 
    await userCart.save();

    res.redirect('/shop');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.changeQuantity = async (req, res, next) => {
 
};
