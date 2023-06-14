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
  
      res.json({ message: "product is added to the cart" });
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
     
  
      if (cart.products[cartIndex].quantity > maxQuantity) {
        return res.json({
          success: false,
          message: "Maximum quantity reached.",
          maxQuantity,
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
  
      cart.products[cartIndex].quantity -= 1;
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
  
  exports.productRemove = async (req, res) => {
    try {
      let { productId } = req.body;
      let userId = req.session.user?._id;
      const userProduct = await productSchema.findById(productId).select("price");
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
      const userCoupon = await userSchema.find();
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
  