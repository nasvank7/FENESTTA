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

    isBlocked:{
        default:false,
        type:Boolean
    }

  
})

const User = new mongoose.model("user",usersSchema);

module.exports=User;