require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICESID;
const client = require("twilio")(accountSid, authToken);

const bcrypt = require("bcrypt");
const userSchema = require("../model/model");
const productSchema = require("../model/product_model");
const CartSchema = require("../model/cart");
const couponSchema = require("../model/coupon");
const orderSchema = require("../model/order");
const bannerSchema = require("../model/banner");
const offerSchema = require("../model/offer");
const session = require("express-session");
const fs = require("fs");
const bodyparser = require("body-parser");

const { homedir } = require("os");
const { ObjectId } = require("mongodb-legacy");
const { log } = require("console");
const { Error } = require("mongoose");
//to get index
exports.index = async (req, res) => {
  try {
    const product = await productSchema.find();
    const bestseller = product.slice(0, 3);
    const banner = await bannerSchema.find();
    let user = req.session.user;
    res.render("user/index", { bestseller, user, banner });
  } catch (error) {
    
  }
 
};
// to get homed
exports.Home = async (req, res) => {
  try {
    const product = await productSchema.find();
    const bestseller = product.slice(0, 2);
    const banner = await bannerSchema.find();
  
    let user = req.session.user;
    res.render("user/index", { user, bestseller, banner });
  } catch (error) {
    
  }

};
//to get login
exports.getLogin = (req, res) => {
  try {
    const user = req.session.user;
    res.render("user/login", { user, message: req.session.message });
  } catch (error) {
    
  }

};
//to get signup
exports.dosignup = (req, res) => {
  try {
    const user = req.session.user;
  res.render("user/signup", { user });
  } catch (error) {
    
  }
  
};
// to post in this.doSignup
exports.doSignup = async (req, res) => {
  try {
    const user = req.session.user;
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

  try {
    const email = req.body.email;
    const password = req.body.password;
  
    const user = await userSchema.findOne({ email: email });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        if (user.isBlocked) {
          req.session.message = "user cant be login plz contact admin";
          res.redirect("/login");
        } else {
          req.session.user = user;
          res.redirect("/");
        }
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

//to get otp oage
exports.getlogin_otp = (req, res) => {
  try {
    const user = req.session.user;
  res.render("user/login-otp", { user });
  } catch (error) {
    
  }
  
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


exports.Addaddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const { name, Address, phone, zip, city, state } = req.body;

    const user = await userSchema.findOne({ _id: userId });
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
  
    // console.log(address);

    let cart = await CartSchema.findOne({ user }).populate(
      "products.productId"
    );
    const coupon = await couponSchema.find();
    if (users) {
      const address = users.address[0];

      res.render("user/checkout", { user, users, cart, address, coupon });
    } else {
      res.status(404).send("Address not found");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};


exports.userProfile = async (req, res) => {
  try {
    const user = req.session.user;
  
    const userData = await userSchema.findOne(user).populate("address");
    console.log(userData);
    res.render("user/userProfile", { user, userData });
  } catch (error) {
    
  }
 
};

exports.updateProfile = async (req, res) => {
  try {
    const user = req.session.user;
    res.render("user/updateProfile", { user });
  } catch (error) {
    
  }

};

exports.UpdateProfile = async (req, res) => {
  try {
    // let user=req.session.user
    const userId = req.session.user?._id;
    const userData = await userSchema.findByIdAndUpdate(
      userId,
      {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
      },
      { new: true }
    );
    const user = (req.session.user = userData);
    res.render("user/userProfile", { user, userData });
  } catch (error) {
    console.log(error, "jhvsnvsdv");
  }
};
exports.updatePassword = async (req, res) => {};

exports.LowToHigh = async (req, res) => {
  const pageSize = 12;
  const currentPage = parseInt(req.query.page) || 1;
  try {
    const user = req.session.user;
    const user_id = req.session.user_id;
    const totalProducts = await productSchema.countDocuments({ Blocked: true });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    const product = await productSchema
      .find({ Blocked: true })
      .sort({ price: 1 })
      .skip(skip)
      .limit(pageSize);
    res.render("user/shop", {
      product,
      user,
      user_id,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.render("error", { message: "Error fetching products" });
  }
};

exports.HighToLow = async (req, res) => {
  const pageSize = 12;
  const currentPage = parseInt(req.query.page) || 1;

  try {
    const user = req.session.user;
    const user_id = req.session.user_id;
    const totalProducts = await productSchema.countDocuments({ Blocked: true });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    const product = await productSchema
      .find({ Blocked: true })
      .sort({ price: -1 })
      .skip(skip)
      .limit(pageSize);
    res.render("user/shop", {
      product,
      user,
      user_id,
      totalPages,
      currentPage,
    });
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
   
    const totalProducts = await productSchema.countDocuments({
      name: { $regex: new RegExp(query, "i") },
    });
    const totalPages = Math.ceil(totalProducts / pageSize);
    const skip = (currentPage - 1) * pageSize;
    const product = await productSchema
      .find({ name: { $regex: new RegExp(query, "i") } })
      .skip(skip)
      .limit(pageSize);

    res.render("user/shop", { product, user, totalPages, currentPage });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.Forgotpage = (req, res) => {
  try {
    res.render("user/forgot-password");
  } catch (error) {
    
  }

};

exports.SendOTP = async (req, res) => {
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
};
exports.verifyForget = async (req, res) => {
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
      res.render("user/forgot-password", {
        message: "Invalid verification code",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while verifying the code",
    });
  }
};

exports.forgot_password = async (req, res) => {
  const phoneNumber = req.session.phone;
  const password = req.body.password;

  

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
                res.status(404).send({
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
    res.status(500).send({
      message: err.message || "Some error occurred while verifying the code",
    });
  }
};
exports.UserAdressess = async (req, res) => {
  try {
    const user = req.session.user;

    const userWithAddresses = await userSchema.findOne(user).populate("address");

    const addresses = userWithAddresses.address;

  
    res.render("user/userAddresses", { user, addresses });
  } catch (error) {
    
  }
 
};

exports.UserOrder = async (req, res) => {
  try {
    let user = req.session.user;
    const userId = req.session.user?._id;
    const orderData = await orderSchema
      .find({ user: userId })
      .populate("items.product");

    res.render("user/userOrders", { orderData, user });
  } catch (error) {
    console.log(error);
  }
};

exports.EditAddress = async (req, res) => {
  try {
    const user = req.session.user;
    const userWithAddresses = await userSchema.findOne(user).populate("address");
    const addresses = userWithAddresses.address[0]; 
    res.render("user/editAddress", { user, addresses });
  } catch (error) {
    
  }

};

exports.updateAddress = async (req, res) => {
  try {
    const user = req.session.user;
    const id = req.params.id;
    const userId = req.session.user?._id;
  
    const updatedAddress = {
      name: req.body.name,
      Address: req.body.address,
      state: req.body.state,
      city: req.body.city,
      phone: req.body.phone,
    };
  
    const editedAddress = await userSchema.findOneAndUpdate(
      { _id: userId, "address._id": id },
      { $set: { "address.$": updatedAddress } },
      { new: true }
    );
    const addresses = editedAddress.address[0];
    res.render("user/userAddresses", { addresses, user });
  } catch (error) {
    
  }

};
