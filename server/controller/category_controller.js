const bcrypt = require("bcrypt");
const userSchema = require("../model/model");
const productSchema = require("../model/product_model");
const CartSchema = require("../model/cart");
const categorySchema = require("../model/add_category");

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

exports.category_find = async (req, res) => {
    const admin = req.session.admin;
    categorySchema
      .find()
      .then((category_find) => {
        res.render("admin/category_page", { admin, category_find });
      })
  
      .catch((error) => {
        console.log(error);
        res.status(500).send("Server Error");
      });
  };
  
  // to get add category page
  exports.add_Category = (req, res) => {
    try {
      const admin = req.session.admin;
      res.render("admin/add_category", { admin });
    } catch (error) {
      
    }
   
  };
  
  // to add category
  exports.add_category = async (req, res) => {
    try {
      let category = req.body.category;
      const existingCategory = await categorySchema.findOne({
        category: { $regex: new RegExp(`^${category}$`, "i") },
      });
  
      if (existingCategory) {
        return res.send(
          '<script>alert("Category already exists"); window.location.href = "/category_page";</script>'
        );
      } else {
        const user = new categorySchema({
          category: req.body.category,
          description: req.body.description,
        });
        const data = await user.save();
        res.redirect("category_page");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message:
          error.message ||
          "Some error occurred while creating a create operation",
      });
    }
  };
  
  //to delete category
  exports.deleteCategory = async (req, res) => {
    try {
      const id = req.params.id;
      const result = await categorySchema.findByIdAndRemove(id);
      if (result) {
        res.redirect("/category_page");
      } else {
        res.redirect("/category_page");
      }
    } catch (error) {
      console.log(error);
      res.send("some error occured");
    }
  };

  exports.getHoodies = async (req, res) => {
    const pageSize = 12;
    const currentPage = parseInt(req.query.page) || 1;
    try {
      let user = req.session.user;
      let userId = req.session.user?._id;
      const totalProducts = await productSchema.countDocuments({ Blocked: true });
      const totalPages = Math.ceil(totalProducts / pageSize);
      const skip = (currentPage - 1) * pageSize;
      let product = await productSchema.find({ category_name: "HOODIES" });
      res.render("user/shop", { user, product, currentPage, totalPages });
    } catch (error) {
      console.log("error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  exports.getShirts = async (req, res) => {
    const pageSize = 12;
    const currentPage = parseInt(req.query.page) || 1;
    try {
      let user = req.session.user;
      let userId = req.session.user?._id;
      const totalProducts = await productSchema.countDocuments({ Blocked: true });
      const totalPages = Math.ceil(totalProducts / pageSize);
      const skip = (currentPage - 1) * pageSize;
      let product = await productSchema
        .find({ category_name: "SHIRT" })
        .skip(skip)
        .limit(pageSize);
      res.render("user/shop", { user, product, currentPage, totalPages });
    } catch (error) {
      console.log("error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  exports.getTshirts = async (req, res) => {
    const pageSize = 12;
    const currentPage = parseInt(req.query.page) || 1;
    try {
      let user = req.session.user;
      let userId = req.session.user?._id;
      const totalProducts = await productSchema.countDocuments({ Blocked: true });
      const totalPages = Math.ceil(totalProducts / pageSize);
      const skip = (currentPage - 1) * pageSize;
      let product = await productSchema
        .find({ category_name: "T SHIRT" })
        .skip(skip)
        .limit(pageSize);
      const offer = await offerSchema.find({ categoryOffer: "T SHIRT" });
      res.render("user/shop", { user, product, currentPage, totalPages });
    } catch (error) {
      console.log("error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };