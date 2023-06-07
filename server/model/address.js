const mongoose=require("mongoose")

var AddressSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    name:{
        type:String,
        require:true
    }
    ,
    address:{
        type:String,
        require:true
       
    },

    phone:{
        type:Number,
        require:true,
        unique:true
       
       
    },
    
    pincode:{
        type:String,
        require:true,
       
       
    },
    city:{
        type:String,
        require:true
    },
    state:{
        type:String,
        require:true
    }


  
})

const Address = new mongoose.model("address",AddressSchema);

module.exports= Address;