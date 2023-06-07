const mongoose=require("mongoose")

var usersSchema=new mongoose.Schema({
    name:{
        type:String,
        require:true
    }
    ,
    username:{
        type:String,
        require:true
       
    },
    email:{
        type:String,
        require:true,
        unique:true
       
       
    },
    phone:{
        type:Number,
        require:true,
        unique:true
       
       
    },
    
    password:{
        type:String,
        require:true,
       
       
    },
    address:[{
       name:String,
       Address:String,
       state:String,
       city:String,
       pincode:String,
       phone:Number,
    }],
    coupon:[String],

    isBlocked:{
        default:false,
        type:Boolean
    }

  
})

const User = new mongoose.model("user",usersSchema);

module.exports=User;