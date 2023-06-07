const mongoose=require("mongoose")

var productSchema=new mongoose.Schema({

    name:{
        type:String,
        require:true
       
    },
    price:{
        type:Number,
        require:true,
        
       
    },
    photo:[{
        type:String,
        require:true,
       
       
    }],
    category_name:{
        type: mongoose.Schema.Types.ObjectId,
        type:String,
        ref: 'category',
    },
    stock:{
        type:Number,
        require:true

    }
    ,
    description:{
       type:String,
       require:true
    },
    Blocked:{
        default:false,
        type:Boolean
    }

  
})

const Product = new mongoose.model("product",productSchema);


module.exports=Product;