const mongoose=require('mongoose')

const couponSchema= new mongoose.Schema({
    code:{
        type:String,
        require:true
    },
    date:{
        type:Date,
        require:true
    },
    discount:{
        type:String,
        require:true
    },
    status:{
        type:Boolean,
       default:false
    }
})
const Coupon= new mongoose.model("coupon",couponSchema)

module.exports=Coupon