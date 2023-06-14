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



exports.Offer=async(req,res)=>{
    try {
     
      const admin=req.session.admin
      const  categoryOffer=await offerSchema.find()
      res.render('admin/offer',{admin,categoryOffer})
    } catch (error) {
      console.log(error)
    }
  }
  
  exports.CategoryOffer=async(req,res)=>{
    try {
      const admin=req.session.admin
  
      res.render('admin/addCategoryOffer',{admin})
    } catch (error) {
      
    }
  }
  exports.categoryoffer=async(req,res)=>{
    try {
       const categoryOffer=req.body.categorytitle
     
       const existingofferforcategory=await offerSchema.find({categoryOffer:categoryOffer})
       if(existingofferforcategory){
        console.log("it is already existed")
       }
       const category_Offer=await categorySchema.findOne({category:categoryOffer})
    
       if (category_Offer) {
        const CategoryOffer=new offerSchema({
          categoryOffer:req.body.categorytitle,
          date:req.body.date,
          offer:req.body.offer
       })
    
  
       await CategoryOffer.save()
       res.redirect('/offer')
       }
    
    } catch (error) {
      
    }
  }
  exports.offercategory=async(req,res)=>{
    try {
      const offerId=req.params.id
      const categoryOffer=await offerSchema.findById(offerId)
     
      if(categoryOffer){
        if(categoryOffer.status){
         res.render('admin/offer',{ categoryOffer,status:false,message:"Another offer is applied"})
        }
        const products=await productSchema.find({category_name:categoryOffer.categoryOffer})
    
    
        for(const product of products){
          const discountedPrice=product.price-categoryOffer.offer
      
    
          if(product.price>discountedPrice){
            product.price=discountedPrice
      
            product.originalPrice=product.price+categoryOffer.offer
            await product.save()
        
          }
        }
        categoryOffer.status=true
        await categoryOffer.save()
       res.redirect('/offer')
      }
    } catch (error) {
      
    }
  
  
  }
  exports.deoffercategory=async(req,res)=>{
    try {
      const offerId=req.params.id
      const categoryOffer=await offerSchema.findById(offerId)
  
      if(categoryOffer){
       
        const products=await productSchema.find({category_name:categoryOffer.categoryOffer})
      
    
        for(const product of products){
          const Originalprice=product.price+categoryOffer.offer
        
          
          if(product.price<Originalprice){
            product.price=Originalprice
  
            product.originalPrice=product.price+categoryOffer.offer
            await product.save()
  
          }
        }
        categoryOffer.status=false
        await categoryOffer.save()
       res.redirect('/offer')
    }
    } catch (error) {
      
    }
   
  }


  exports.CategoryOffertshirts=async(req,res)=>{
    const pageSize = 3;
    const currentPage = parseInt(req.query.page) || 1;
    try {
      let user = req.session.user;
      let userId = req.session.user?._id;
      const totalProducts = await productSchema.countDocuments({ Blocked: true });
      const totalPages = Math.ceil(totalProducts / pageSize);
      const skip = (currentPage - 1) * pageSize;
      let product = await productSchema.find({ category_name: "T SHIRT" }).skip(skip).limit(pageSize)
    
      const offer=await offerSchema.find({categoryOffer:"T SHIRT" })
  
       if(offer){
         
     const originalprice=product.map((element,i)=>(element.price+offer[0].offer))
 
        res.render("user/categoryOffer", { user, product,currentPage,totalPages,originalprice,offer})
       }
    
    } catch (error) {
      console.log("error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  exports.CategoryOfferhoodies=async(req,res)=>{
    const pageSize = 3;
    const currentPage = parseInt(req.query.page) || 1;
    try {
      let user = req.session.user;
      let userId = req.session.user?._id;
      const totalProducts = await productSchema.countDocuments({ Blocked: true });
      const totalPages = Math.ceil(totalProducts / pageSize);
      const skip = (currentPage - 1) * pageSize;
      let product = await productSchema.find({ category_name: "HOODIES" }).skip(skip).limit(pageSize)
     
      const offer=await offerSchema.find({categoryOffer:"HOODIES" })
  
       if(offer){
         
     const originalprice=product.map((element,i)=>(element.price+offer[0].offer))
        res.render("user/categoryOffer", { user, product,currentPage,totalPages,originalprice,offer})
       }
    
    } catch (error) {
      console.log("error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  exports.CategoryOffershirts=async(req,res)=>{
    const pageSize = 3;
    const currentPage = parseInt(req.query.page) || 1;
    try {
      let user = req.session.user;
      let userId = req.session.user?._id;
      const totalProducts = await productSchema.countDocuments({ Blocked: true });
      const totalPages = Math.ceil(totalProducts / pageSize);
      const skip = (currentPage - 1) * pageSize;
      let product = await productSchema.find({ category_name: "SHIRT" }).skip(skip).limit(pageSize)
     
      const offer=await offerSchema.find({categoryOffer:"SHIRT" })
      
       if(offer){
         
     const originalprice=product.map((element,i)=>(element.price+offer[0].offer))
   
        res.render("user/categoryOffer", { user, product,currentPage,totalPages,originalprice,offer})
       }
    
    } catch (error) {
      console.log("error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }