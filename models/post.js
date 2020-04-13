var mongoose=require("mongoose");

var postSchema=new mongoose.Schema({
    user:{
        id:{
         type:mongoose.Schema.Types.ObjectId,
        ref:"User"   
        },
        username:String,
        image:String,
    },
    caption:{
        type:String
    },
    postimage:{
        type:String
    },
    date:{
        type:Date,
        default:Date.now
    },
    likeUsers:[{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String,
        image:String,
    }],
    likecount:{
        type:Number,
        default:0
    }
    
})

var Post=mongoose.model("Post",postSchema);

module.exports=Post;