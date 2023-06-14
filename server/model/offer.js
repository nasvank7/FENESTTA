const mongoose=require('mongoose')

const offerSchema= new mongoose.Schema({
   
    categoryOffer:{
        type:String,
        require:true
    },
    date:{
        type:Date,
        require:true
    },
    offer:{
        type:Number,
        require:true
    },
    status:{
        type:Boolean,
       default:false
    }
})
const Offer= new mongoose.model("offer",offerSchema)

module.exports=Offer