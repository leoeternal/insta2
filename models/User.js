var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username:{
        type:String
    },
    image:{
        type:String,
        default:"https://profiles.utdallas.edu/img/default.png"
    },
    password:{
        type:String
    },
    email:{
        type:String
    },
    gender:{
        type:String
    },
    messagealert:{
        type:Boolean,
        default:false
    },
    bio:{
        type:String,
        default:null
    },
    followings:[{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String,
        image:String
    }]
});

userSchema.plugin(passportLocalMongoose);

var User=mongoose.model("User",userSchema);

module.exports=User;