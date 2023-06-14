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


exports.Banner = async (req, res) => {
  try {
    const admin = req.session.admin;
    const Banner_data = await bannerSchema.find().exec();
    res.render("admin/banner", { admin, Banner_data });

  } catch (error) {
    
  }
  
  };
  
  exports.AddBanner = async (req, res) => {
    try {
      const admin = req.session.admin;
      res.render("admin/addBanner", { admin });
    } catch (error) {
      
    }
  
  };
  exports.ADDBanner = async (req, res) => {
    try {
      const Banner = new bannerSchema({
        name: req.body.name,
        photo: req.files.map((file) => file.filename),
        date: req.body.date,
      });
      
      await Banner.save();
  
      const Banner_data = await bannerSchema.find().exec();
      res.render("admin/banner", { Banner_data });
  
    } catch (error) {
      console.log(error);
    }
  };
  exports.UpdateBanner = async (req, res) => {
    try {
      const id = req.params.id;
  
      let new_images = [];
      if (req.files && req.files.length > 0) {
        new_images = req.files.map((file) => file.filename);
  
        try {
          if (req.body.photo && Array.isArray(req.body.photo)) {
            req.body.photo.forEach((photo) => {
              fs.unlinkSync("./uploads/" + photo);
            });
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        new_images = req.body.photo;
      }
  
      const Banner_data = await bannerSchema.findByIdAndUpdate(
        id,
        {
          name: req.body.name,
  
          photo: new_images,
        },
  
        { new: true }
      );
  
  
      if (Banner_data) {
        req.session.message = {
          type: "success",
          message: "banner update successful",
        };
        req.session.authorized = true;
        res.redirect("/banner");
      } else {
        req.session.message = {
          type: "error",
          message: "banner not found",
        };
        res.redirect("/banner");
      }
    } catch (error) {
      console.error(error);
      res.send(error);
    }
  };
  
  exports.activateBanner = async (req, res) => {
    try {
      const id = req.params.id;
      await bannerSchema.findByIdAndUpdate(
        id,
        {
          status: true,
        },
        { new: true }
      );
      res.redirect("/banner");
    } catch (error) {
      console.log(error);
    }
  };
  exports.deactivateBanner = async (req, res) => {
    try {
      const id = req.params.id;
      await bannerSchema.findByIdAndUpdate(
        id,
        {
          status: false,
        },
        { new: true }
      );
      res.redirect("/banner");
    } catch (error) {
      console.log(error);
    }
  };