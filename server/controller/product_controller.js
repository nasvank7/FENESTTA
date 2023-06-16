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
    try {
      const product = await productSchema.find();
      const newarrival = product.slice(Math.max(product.length - 2, 0));
      const user = req.session.user;
      res.render("user/newarrival", { user, newarrival });
    } catch (error) {
      
    }
   
  };
  
  //to get single product page
  exports.single_product = async (req, res) => {
    try {
      const { id } = req.params;
      const product = await productSchema.findById(id);
      const user = req.session.user;
   
      res.render("user/single-product", { product, user });
    } catch (error) {
      
    }

  };

  exports.find_product = async (req, res) => {
    try {
      const admin = req.session.admin;
      const product_data = await productSchema.find().exec();
      res.render("admin/products", { admin, product_data });
    } catch (error) {
      console.log(error);
      res.send({ message: error.message });
    }
  };

  exports.add_Product = async (req, res) => {
    try {
      const admin = req.session.admin;
      const data = await categorySchema.find();
      res.render("admin/add_product_page", { admin, data });
    } catch (error) {
      console.log(error);
    
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
  