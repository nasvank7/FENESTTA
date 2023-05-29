require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = "VA72b5cdba229719556327c6fbe8dc3a1e";
const client = require("twilio")(accountSid, authToken);

const bcrypt = require("bcrypt");
const userSchema = require("../model/model");
const productSchema = require("../model/product_model");
const CartSchema=require('../model/cart')
const AddressSchema=require('../model/address')
const session = require("express-session");
const fs = require("fs");
const { homedir } = require("os");
const { ObjectId } = require("mongodb-legacy");
const { log } = require("console");
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
  req.session.destroy()
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
  try {
     let userId=req.session.user?._id
  let user= req.session.user
  let cart= await CartSchema.findOne({user:userId}).populate(
    "products.productId"
  )
  if (cart) {
    let products=cart.products
    let cartId=cart._id
    res.render('user/cart',{user,products,userId})
  } else {
    res.render('user/emptyCart',{user})
  }

    // Code for fetching cart data and rendering view
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing your request.");
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


exports.updateQuantity = async (req, res, next) => {
  const userId = req.session.user?._id;
  const cartItemId = req.body.cartItemId;

  try {
    const cart = await CartSchema.findOne({ user: userId }).populate("products.productId")
    console.log(cart,cartItemId);
    console.log(',jsdvfksjd');

    const cartIndex = cart.products.findIndex((item) => item.productId.equals(cartItemId));
     console.log(cartIndex);
     console.log('xdjfb');
    if (cartIndex === -1) {
      return res.json({ success: false, message: "Cart item not found." });
    }

    cart.products[cartIndex].quantity += 1;
    await cart.save();

    console.log(cart.products[cartIndex].quantity);
    console.log(cart.products[cartIndex].price);
    // console.log(cart.product[cartIndex]);
    const total = cart.products[cartIndex].quantity* cart.products[cartIndex].productId.price;
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
};
exports.decrementQuantity=async(req,res,next)=>{
  const userId = req.session.user?._id;
  const cartItemId = req.body.cartItemId;
  console.log("456");
  console.log(userId);
  console.log("123");

  try {
    const cart = await CartSchema.findOne({ user: userId }).populate("products.productId")
    console.log(cart,cartItemId);
    console.log(',jsdvfksjd');

    const cartIndex = cart.products.findIndex((item) => item.productId.equals(cartItemId));
     console.log(cartIndex);
     console.log('xdjfb');
    if (cartIndex === -1) {
      return res.json({ success: false, message: "Cart item not found." });
    }

    cart.products[cartIndex].quantity -= 1;
    await cart.save();

    console.log(cart.products[cartIndex].quantity);
    console.log(cart.products[cartIndex].price);
    // console.log(cart.product[cartIndex]);
    const total = cart.products[cartIndex].quantity* cart.products[cartIndex].productId.price;
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
//   console.log('xkbdsjn f');
//   const cartItemId = req.body.cartItemId;
// console.log(cartItemId);
//   try {
//     const cartItem = await CartSchema.findById(cartItemId);
//     console.log(cartItem);
//     cartItem.quantity -= 1;
//     await cartItem.save();
//     const total = cartItem.quantity * cartItem.price;
//     const quantity = cartItem.quantity;

//     res.json({
//       success: true,
//       message: "Quantity updated successfully.",
//       total,
//       quantity,
//     });
//   } catch (err) {
//     res.json({ success: false, message: "Failed to update quantity." });
//   }
};
//  exports.deleteproduct=async(req,res)=>{
 
// try {
//   let userId=req.session.user._id
//   let id=req.params.id

//   const result =await CartSchema.findOneAndUpdate(
//     { user:userId },
//     { $pull: { products: { _id: id } } },
//     { new: true })
//     if(result)
//       {
      
//         res.redirect("/cart");
//       } else{
//         res.redirect('/cart')
//       }
      
  
    
   
// } catch (error) {
//   res.status(500).send(err.message); 

// }
// }
 exports.productRemove=async(req,res)=>{
  console.log('eivvedh');
  try {
    let {productId}=req.body
    let userId=req.session.user?._id
    const userProduct=await productSchema.findById(productId).select('price')
    console.log(userProduct);
    if(!userProduct){
      res.send({message:'product not found'})
    }
    const userCart=await CartSchema.findOne({user:userId})
    console.log(userCart,'sdfhsdgfdsjhgfjhgsjdghf');
    const productCount=userCart.products.length-1
    if(userCart){
      const itemIndex=userCart.products.findIndex((item)=> item.productId.equals(productId))

      if(itemIndex>-1){
        userCart.products.splice(itemIndex,1)
        await userCart.save()
        res.json ({status:true,message:'product removed from cart',length:productCount})
      }else{
        res.json ({status:false,message:"product not found"})
      }
    }else{
      res.json ({status:false,message:"cart not found"})
    }
  
  } catch (error) {
    console.log(error);
  }
 }
 exports.checkOut=async(req,res)=>{
  try {
    let user=req.session.user
    //problem her
    var addressofdelivery = await AddressSchema.find().exec();
      res.render('user/addresspage', { user,addressofdelivery });
    
  } catch (error) {
    console.log(error);
  }
 }
 exports.Addaddress = async (req, res) => {
  try {
    let user = req.session.user;
    console.log('hjgcjv');
    const existingAddress = await AddressSchema.findOne({
      $or: [{ address: req.body.address }, { phone: req.body.phone }]
    });

    if (existingAddress) {
      // User with given email or phone already exists
      res.render("user/addresspage", { user, msg: "Address already exists" });
      console.log('already');
    } else {
      console.log('jsvhfalsjfn');
      const address = new AddressSchema({
        name: req.body.name,
        address: req.body.address,
        phone: req.body.phone,
        pincode: req.body.pincode,
        city: req.body.city,
        state: req.body.state,
      });
      console.log(address);
      
      await address.save();
      
      var addressofdelivery = await AddressSchema.find().exec();
      res.render('user/addresspage', { user,addressofdelivery:addressofdelivery });
    }
  } catch (error) {
    console.log(error);
    // res.send({ message: "Error occurred while registering" });
  }
};

 