const bcrypt = require("bcrypt");
const userSchema = require("../model/model");
const productSchema = require("../model/product_model");
const CartSchema = require("../model/cart");
const AddressSchema = require("../model/address");
const couponSchema=require('../model/coupon')
const orderSchema = require("../model/order");
const walletSchema=require('../model/wallet')
const bannerSchema=require('../model/banner')
const offerSchema=require('../model/offer')
const session = require("express-session");
const fs = require("fs");
const bodyparser = require("body-parser");
let paypaltotal = 0;
const { homedir } = require("os");
const { ObjectId } = require("mongodb-legacy");
const { log } = require("console");
const { Error } = require("mongoose");



exports.Coupon = async (req, res) => {
  try {
    const admin = req.session.admin;
    const coupon = await couponSchema.find().exec();
  
    res.render("admin/coupon", { admin, coupon });
  } catch (error) {
    
  }
   
  };
  exports.AddCoupon = async (req, res) => {
    try {
      const admin = req.session.admin;
      res.render("admin/addCoupon", { admin });
    } catch (error) {
      
    }
   
  };
  exports.addCoupon = async (req, res) => {
    try {
      const code = req.body.code;
      const existingCoupon = await couponSchema.findOne({ code: code });
  
      if (existingCoupon) {
        console.log("coupon is already existed");
      } else {
        const coupon = new couponSchema({
          code: req.body.code,
          date: req.body.date,
          discount: req.body.discount,
        });
    
        await coupon.save();
        res.redirect("/coupon");
      }
    } catch (error) {
      console.log(error);
    }
  };

  exports.CouponDeactivate = async (req, res) => {
    try {
      const id = req.params.id;
      await couponSchema.findByIdAndUpdate(
        id,
        {
          status: false,
        },
        { new: true }
      );
  
      res.redirect("/coupon");
    } catch (error) {
      console.log(error);
    }
  };
  exports.CouponActivate = async (req, res) => {
    try {
      const id = req.params.id;
      await couponSchema.findByIdAndUpdate(
        id,
        {
          status: true,
        },
        { new: true }
      );
  
      res.redirect("/coupon");
    } catch (error) {
      console.log(error);
    }
  };
  
  exports.redeemCoupon = async (req, res) => {
    const { coupon} = req.body
    const userId = req.session.user._id;
  
    const couponFind = await couponSchema.findOne({ code: coupon });
    const userCoupon = await userSchema.findById(userId);
    if (userCoupon.coupon.includes(coupon)) {
      return res.json({
        success: false,
        message: 'Coupon Already used'
      });
    }
  
  
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
      
    
     
      if (!cart) {
  console.log("Cart not found");
        return; 
      }
     
      cart.total = amount;
  
      await cart.save();
  
    } catch (error) {
      console.error("Error updating cart:", error);
      // handle the error appropriately
    }
    
  
  };
  exports.cancelRedeemCoupon = async (req, res) => {
    try {
  
      const userId = req.session.user._id;
    
      const userCoupon = await userSchema.findById(userId);
      const cart = await CartSchema.findOne({ user: userId });
    
      
      if (!userCoupon || !cart) {
        return res.json({
          success: false,
          message: 'User or cart not found',
        });
      }
    
     
      const redeemedCoupon = userCoupon.coupon[userCoupon.coupon.length - 1];
      userCoupon.coupon.pop();
      await userCoupon.save();
    
     
      const previousTotal = parseFloat(cart.total);
      const redeemedAmount = parseFloat(redeemedCoupon.amount);
      if (isNaN(previousTotal) || isNaN(redeemedAmount)) {
        return res.json({
          success: false,
          message: 'Invalid total or redeemed amount',
        });
      }
      cart.total = previousTotal + redeemedAmount;
    
      await cart.save();
     
      res.json({
        success: true,
        message: 'Redeemed amount canceled',
      
        newTotal: parseFloat(cart.total),
      });
    } catch (error) {
      
    }
  
  
   
  };
  