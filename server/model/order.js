const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
 
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  total: {
    type: Number,
   
 
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered','cancelled', 'Returned','Refunded Amount'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  payment_method:{
    type:String,
    enum:['cardpayment','razorpay','cashondelivery','paypal'],
    
    
  },
 
  address:{
  type:Object
  },
  reason:{
    type:String
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports=Order;