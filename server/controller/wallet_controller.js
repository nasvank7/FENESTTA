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


exports.Wallet = async (req, res) => {
  try {
    const user = req.session.user;
    let sum = 0;
  
    const walletbalance = await walletSchema.findOne({ userId: user }).populate('orderId');
    const RefundedOrder = await orderSchema.find({ user: user, status: "Refunded Amount" }).populate('items.product');
  
    if (walletbalance) {
      const items = walletbalance.orderId[0].items;
      sum += walletbalance.balance;
      const wallet = walletbalance.orderId;
      res.render('user/wallet', { user, wallet, sum, walletbalance, RefundedOrder });
    } else {
      res.render('user/wallet', { user, wallet: null, sum, walletbalance: null, RefundedOrder });
    }
  } catch (error) {
    
  }

  };
  exports.wallet_buy = async(req,res)=>{
    try{
      const userId= req.session.user._id
   
  
      const wallet = await walletSchema.findOne({ userId: userId });
     const cart= await CartSchema.findOne({user:userId}).populate("products.productId")
     let totalprice=0
  
     const items = cart.products.map((item) => {
      const product = item.productId;
      const quantity = item.quantity;
      const price = item.productId.price
     
     
      totalprice += price * quantity;
      
     })
  
     console.log(totalprice,"kk q");
     const balance = (10 / 100) * totalprice;
  
      let wallet_balance= wallet.balance
       if (balance <  wallet.balance) {
     totalprice -= balance;
     cart.wallet = balance;
      await cart.save();
  
  
        
       wallet.balance-=balance
  
       console.log( wallet.balance,"before");
        await wallet.save();
        console.log( wallet.balance,"after");
  
  
    }
    res.json({
      success: true,
      message: "Wallet add Successful",
      totalprice,
      wallet_balance
    });
  
  }catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
    }
  
  };
  
  exports.Refund = async (req, res) => {
    const { id } = req.params;
  
    try {
      const order = await orderSchema
        .findById(id)
        .populate({ path: "items.product" });
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
          transactions: [order.payment_method],
        });
        console.log(newWallet);
        await newWallet.save();
      }
  
      await orderSchema.updateOne(
        { _id: id },
        { $set: { status: "Refunded Amount" } }
      );
  
      res.redirect("/order-details");
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  };