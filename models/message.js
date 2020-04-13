var mongoose=require("mongoose");

var messageSchema=new mongoose.Schema({
    senderinfo:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String,
        image:String,
        messages:[{
            type:String,
            default:""
        }]
    },
    
    recieverinfo:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String,
        image:String,
        messages:[{
            type:String,
            default:""
        }]
    },
    status:{
        type:Number
    }
});

var Message=mongoose.model("Message",messageSchema);

module.exports=Message;