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
const { orderDetail } = require("./user_controller");


exports.orderData = async (req, res) => {
    try {
      const admin = req.session.admin;
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
     
      res.render("admin/order", { admin, order_data });
    } catch (error) {
      console.log(error);
    }
  };
  
  
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
      const address = await orderSchema.findById(id).populate("address");
  
   
  
      res.render("admin/orderDetails", { order, address });
    } catch (error) {
      console.log(error);
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
      const wallet_discount=cart.wallet
     
  
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
  
      if (wallet_discount!=totalPrice && wallet_discount>=0) {
        totalPrice -= wallet_discount;
       
        
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
        await order.save()
  
        const total = order.total;
        paypaltotal = order.total;
        await CartSchema.deleteOne({ user: userId });
        let createPayment = {
          intent: "sale",
          payer: {
            payment_method: "paypal",
          },
          redirect_urls: {
            return_url: "http://fenestta.shop/paypal-success",
            cancel_url: "http://fenestta.shop/paypal-err",
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
     
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  exports.paypalSuccess = async(req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const user = req.session.user;
    const userId = req.session.user?._id;
    const total = paypaltotal;
    const order=req.session.order
 
  
   
  
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
      async function (error, payment) {
        if (error) {
          throw error;
        } else {
          
         
          res.render("user/paypal-success", { payment, user, userId });
        }
      }
    );
  };
  
  
  exports.orderDetail = async (req, res) => {
    try {
      let user = req.session.user;
      const userId = req.session.user?._id;
      const orderData = await orderSchema
        .find({ user: userId })
        .populate("items.product");

  
      res.render("user/orderDetails", { orderData, user });
    } catch (error) {
      console.log(error);
    }
  };

  
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
      res.render("user/orderView", { user, order,address });
    } catch (error) {
      console.log(error);
    }
  };


  exports.Invoice=async(req,res)=>{
    try {
      const user=req.session.user
      const id=req.params.id
      const userOrder=await userSchema.findOne(user)
      const order=await orderSchema.findById(id).populate('items.product')
      const address=await orderSchema.findById(id).populate('address')
      res.render('user/invoice',{user,userOrder,order,address})
    } catch (error) {
      
    }
  
  }

  exports.SalesReport = async (req, res) => {
    try {
      const admin = req.session.admin;
      const filteredOrders = await orderSchema
        .find()
        .populate("user")
        .populate("items.product")
        .populate("address");
      res.render("admin/SalesReport", { admin, filteredOrders });
    } catch (error) {
      
    }

  };
  
  exports.FilterbyDates = async (req, res) => {
    try {
      const admin = req.session.admin;
      const FromDate = req.body.fromdate;
    
      const Todate = req.body.todate;
    
      const filteredOrders = await orderSchema
        .find({ createdAt: { $gte: FromDate, $lte: Todate } })
        .populate("user")
        .populate("items.product")
        .populate("address");
      res.render("admin/SalesReport", { admin, filteredOrders });
    } catch (error) {
      
    }
  
  };
  