var express=require("express");
var bodyParser=require("body-parser");
var mongoose=require("mongoose");
var passport = require("passport");
var localStrategy = require("passport-local");
var flash=require("express-flash-messages");
var multer=require("multer")
var multerS3=require("multer-s3");
var aws=require("aws-sdk");

require("dotenv").config();

var photoname;

var transporter=require("./helper/email/email");

var User=require("./models/User");
var Post=require("./models/post");
var Message=require("./models/message");

var app=express();

app.use(express.static("./public"));

app.use(bodyParser.urlencoded({extened:false}));
app.use(flash())

app.use(require("express-session")({
    secret:"Messi is the best in the world",
    resave:false,
    saveUninitialized:false
}))

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect("mongodb+srv://nikhil123:nikhil123@portfolio-la7ms.mongodb.net/test?retryWrites=true&w=majority");

aws.config.update({
    secretAccessKey: process.env.secretAccessKey,
    accessKeyId: process.env.accessKeyId,
    region: 'us-east-2'
});

var s3 = new aws.S3();

var storage=multerS3({
        s3: s3,
        bucket: 'portfolio-demo-images',
        acl:"public-read",
    metadata:function(req,file,cb){
                cb(null,{fieldName:file.fieldname});
            },
            key:function(req,file,cb){
                photoname=file.originalname
                cb(null,file.originalname);
            },
            rename:function(fieldName,fileName){
                return fileName.replace(/\w+/g,'-').toLowerCase();
            }
        });
var upload = multer({ storage : storage }).single('userPhoto');

app.use(function(req,res,next){
    res.locals.currentUser=req.user;
    next();
})

app.get("/",isLoggedOut,function(req,res){
    res.render("login.ejs",{successmessage:false});
});

app.get("/register",isLoggedOut,function(req,res){
    res.render("register.ejs",{bool:false,usernameval:false});
})

app.post("/register",function(req,res){
    const{ username , password , email , gender } = req.body;
    var emailval=false;
    var usernameval=false;
    User.find({},function(err, finduser) {
        if(err){
            return console.log(err)
        }else{
            for(var i=0;i<finduser.length;i++){
                if(email === finduser[i].email){
                    emailval=true;
                }
                if(username == finduser[i].username){
                    usernameval=true;
                }
            }
        }
        if(emailval==true || usernameval==true){
            res.render("register.ejs",{message:"This email is already used",
            message2:"Username is already taken",
            bool:emailval,
            usernameval:usernameval    
            })
        }
        else{
         User.register(new User({username , email , gender }),password , function(err,userCreated){
        if(err)
        {
            return console.log(err);
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                var mailOptions = {
                      from: 'nikhiljindal79@gmail.com',
                      to: userCreated.email,
                      subject: 'Welcome to CREATE PORTFOLIO',
                      text: 'Thankyou for creating an account on CREATEPORTFOLIO.com. We hope you will create a nice portfolio for yourself.' 
                  };
                  transporter.sendMail(mailOptions, function(error, info){
                  if (error) {
                    console.log(error);
                    } else {
                    console.log('Email sent');
                }
                });
                res.render("login.ejs",{successmessage:true});
            })
        }
    })   
        }
    })
})

app.post("/login",passport.authenticate("local",{
    successRedirect:"/profile",
    failureRedirect:"/"
}),function(req,res){
});

app.get("/logout",function(req, res) {
    req.logout();
    res.redirect("/");
})

app.get("/home",isLoggedIn,function(req, res) {
    var id=req.user.id;
     User.findById({_id:id},function(err,findUser){
        if(err){
            return console.log(err);
        }else{
            Post.find({},function(err, allpostfind) {
                if(err){
                    return console.log(err)
                }else{
                    User.find({},function(err, allusers) {
                        if(err){
                            return console.log(err);
                        }else{
                            res.render("home.ejs",{findUser:findUser,allpostfind:allpostfind,allusers:allusers});
                        }
                    })
                }
            })
        }
    })
})

app.get("/profile",isLoggedIn,function(req, res) {
    const{id}=req.user;
    User.findById({_id:id},function(err,findUser){
        if(err)
        {
            return console.log(err);
        }
        else{
            Post.find({},function(err, allpostfind) {
                if(err){
                    return console.log(err);
                }else{
                    res.render("profile.ejs",{findUser:findUser,allpostfind:allpostfind});      
                }
            })
        }
    })
})

app.post("/profile/:id/bio",function(req,res){
    const id=req.params.id;
    const bio=req.body.bio;
    User.findByIdAndUpdate({_id:id},{bio:bio},function(err,findUser){
        if(err)
        {
            return console.log(err);
        }else{
            res.redirect("/profile");
        }
    })
})

app.post('/profile/:id/image',function(req,res){
    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }
        User.findByIdAndUpdate({_id:req.params.id},{image:"https://portfolio-demo-images.s3.us-east-2.amazonaws.com/"+photoname},function(err,imageUpdated){
            if(err){
                return console.log(err)
            }else{
                res.redirect("/profile");
            }
        })
    });
});

app.get("/explore",function(req, res) {
    User.find({},function(err,allusersfind){
        if(err)
        {
            return console.log(err);
        }
        else{
            Post.find({},function(err, allpostfind) {
                if(err)
                {
                    return console.log(err);
                }else{
                    res.render("explore.ejs",{allusers:allusersfind,allpostfind:allpostfind});      
                }
            })
        }
    })
})

app.get("/show/profile/:id",function(req, res) {
    User.findById({_id:req.params.id},function(err,findUser){
        if(err){
            return console.log(err);
        }else{
            Post.find({},function(err, allpostfind) {
                if(err){
                    return console.log(err);
                }else{
                    res.render("profile.ejs",{findUser:findUser,allpostfind:allpostfind});      
                }
            })
        }
    })
})

app.get("/addpost",function(req, res) {
    res.render("addpost.ejs");
})

app.post("/profile/:id/addpost",function(req, res) {
    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }
        var user={
            id:req.user._id,
            username:req.user.username,
            image:req.user.image
        }
        Post.create({caption:req.body.caption,postimage:"https://portfolio-demo-images.s3.us-east-2.amazonaws.com/"+photoname,date:new Date(),user:user},function(err,postCreated){
            if(err){
                return console.log(err);
            }else{
                User.findById({_id:req.user._id},function(err, findUser) {
                    if(err)
                    {
                        return console.log(err);
                    }else{
                         res.redirect("/home");    
                    }
                })
            }
        })
    })
})

app.get("/post/delete/:id",function(req, res) {
    Post.findByIdAndDelete({_id:req.params.id},function(err,postDeleted){
        if(err){
            return console.log(err);
        }else{
            res.redirect("/home");
        }
    })
})

app.get("/post/edit/:id",function(req, res) {
    Post.findById({_id:req.params.id},function(err, findPost) {
        if(err){
            return console.log(err);
        }else{
            res.render("editpost.ejs",{findPost:findPost});
        }
    })
})

app.post("/edit/post/update/:id",function(req, res) {
    Post.findByIdAndUpdate({_id:req.params.id},{caption:req.body.caption},function(err, postUpdated) {
        if(err)
        {
            return console.log(err);
        }else{
            res.redirect("/home");
        }
    })
})

app.get("/following/:id",function(req, res) {
    User.findById({_id:req.user._id},function(err, loggedInUser) {
        if(err){
            return console.log(err);
        }else{
            User.findById({_id:req.params.id},function(err, visitingUser) {
                if(err){
                    return console.log(err);
                }else{
                    loggedInUser.followings.push(visitingUser);
                    loggedInUser.save();
                    res.redirect("/explore");
                }
            })
        }
    })
})

app.get("/unfollowing/:index/:id",function(req, res){
    User.findById({_id:req.user._id},function(err, loggedInUser) {
        if(err){
            return console.log(err);
        }else{
            User.findById({_id:req.params.id},function(err, visitingUser) {
                if(err){
                    return console.log(err);
                }else{
                    loggedInUser.followings.splice(req.params.index,1);
                    loggedInUser.save();
                    res.redirect("/explore");
                }
            })
        }
    })
})

app.get("/post/like/:currentUserId/:loggedInUserId/:postId/:postdetail",function(req, res) {
    
    Post.findByIdAndUpdate({_id:req.params.postId},{ $inc: {'likecount': 1 } },function(err, findPost) {
        if(err){
            return console.log(err);
        }else{
            User.findById({_id:req.params.currentUserId},function(err, findUser) {
                if(err){
                    return console.log(err);
                }else{
                    findPost.likeUsers.push(findUser);
                    findPost.save();
                    if(req.params.postdetail=="postdetail")
                    {
                        res.redirect("/post/detail/"+findPost._id);
                    }else{
                     res.redirect("/home");   
                    }
                }
            })
        }
    })
})

app.get("/post/dislike/:currentUserId/:loggedInUserId/:postId/:index/:postdetail",function(req, res) {
    
    Post.findByIdAndUpdate({_id:req.params.postId},{ $inc: {'likecount': -1 } },function(err, findPost) {
        if(err){
            return console.log(err);
        }else{
            User.findById({_id:req.params.currentUserId},function(err, findUser) {
                if(err){
                    return console.log(err);
                }else{
                    findPost.likeUsers.splice(req.params.index,1);
                    findPost.save();
                    if(req.params.postdetail=="postdetail")
                    {
                        res.redirect("/post/detail/"+findPost._id);
                    }else{
                        res.redirect("/home");   
                    }
                }
            })
        }
    })
})

app.get("/post/detail/:id",function(req, res) {
    Post.findById({_id:req.params.id},function(err, postDetail) {
        if(err){
            return console.log(err);
        }else{
            res.render("postdetail.ejs",{postDetail:postDetail});
        }
    })
})

app.get("/chat/:profileUser/:loggedInUser",function(req, res) {
    var status=true;
    User.findById({_id:req.params.loggedInUser},function(err, findLoggedInUser) {
        if(err){
            return console.log(err);
        }else{
            User.findById({_id:req.params.profileUser},function(err, findProfileUser) {
                if(err){
                    return console.log(err);
                }else{
                    Message.find({},function(err, allchatrooms) {
                        if(err){
                            return console.log(err);
                        }else{
                            if(allchatrooms.length!=0)
                            {
                                for(var i=0;i<allchatrooms.length;i++)
                                {
                                    if((JSON.stringify(allchatrooms[i].senderinfo.id)== JSON.stringify(findLoggedInUser._id)&&
                                    (JSON.stringify(allchatrooms[i].recieverinfo.id)== JSON.stringify(findProfileUser._id))))
                                    {
                                        status=false;
                                        break;
                                    }
                                    else if((JSON.stringify(allchatrooms[i].senderinfo.id)== JSON.stringify(findProfileUser._id))&&
                                    (JSON.stringify(allchatrooms[i].recieverinfo.id)== JSON.stringify(findLoggedInUser._id)))
                                    {
                                        status=false;
                                        break;
                                    }
                                }
                            }
                            if(status==true || allchatrooms.length == 0)
                            {
                                var profileuser={
                                      id:findProfileUser._id,
                                      username:findProfileUser.username,
                                      image:findProfileUser.image
                                };
                                var loggedinuser={
                                      id:findLoggedInUser._id,
                                      username:findLoggedInUser.username,
                                      image:findLoggedInUser.image
                                };
                                Message.create({senderinfo:loggedinuser,recieverinfo:profileuser,status:1},function(err,chatroomCreatedSender){
                                      if(err){
                                         return console.log(err);
                                      }else{
                                         Message.create({senderinfo:profileuser,recieverinfo:loggedinuser},function(err, chatroomCreatedProfile) {
                                             if(err){
                                                 return console.log(err);
                                             }else{
                                                 res.render("chatroom.ejs",{
                                                     findLoggedInUser:findLoggedInUser,
                                                     findProfileUser:findProfileUser,
                                                     chatroomCreatedSender:chatroomCreatedSender,
                                                     chatroomCreatedProfile:chatroomCreatedProfile});
                                             }
                                         })
                                      }
                                })
                            }
                            else
                            {
                                Message.find({},function(err, allchatroomsfind) {
                                    if(err){
                                        return console.log(err);
                                    }else{
                                        for(var i=0;i<allchatrooms.length;i++)
                                        {
                                           if(JSON.stringify(allchatrooms[i].senderinfo.id)== JSON.stringify(findLoggedInUser._id)&&
                                           (JSON.stringify(allchatrooms[i].recieverinfo.id)== JSON.stringify(findProfileUser._id)))
                                           {
                                               var x=allchatrooms[i];
                                           }
                                           if(JSON.stringify(allchatrooms[i].senderinfo.id)== JSON.stringify(findProfileUser._id)&&
                                           (JSON.stringify(allchatrooms[i].recieverinfo.id)== JSON.stringify(findLoggedInUser._id)))
                                           {
                                               var y=allchatrooms[i];
                                           }
                                        }
                                        res.render("chatroom.ejs",{chatroomCreatedSender:x,
                                        chatroomCreatedProfile:y,
                                        findLoggedInUser:findLoggedInUser,
                                        findProfileUser:findProfileUser})
                                     }
                                })
                            }
                        }
                    })
                }
            })
        }
    })
})

app.post("/send/message/from/:loggedInUser/to/:profileUser/from/:chatroomCreatedSender/to/:chatroomCreatedProfile",function(req, res) {
    var message=req.body.message;
    User.findById({_id:req.params.loggedInUser},function(err, findLoggedInUser) {
        if(err){
            return console.log(err);
        }else{
            User.findById({_id:req.params.profileUser},function(err, findProfileUser) {
                if(err){
                    return console.log(err);
                }else{
                    Message.findById({_id:req.params.chatroomCreatedSender},function(err, chatroomCreatedSender) {
                        if(err){
                            return console.log(err);
                        }else{
                            Message.findById({_id:req.params.chatroomCreatedProfile},function(err, chatroomCreatedProfile) {
                                if(err)
                                {
                                    return console.log(err);
                                }else{
                                    if(JSON.stringify(chatroomCreatedSender.senderinfo.id)==JSON.stringify(findLoggedInUser._id))
                            {
                               
                             chatroomCreatedSender.senderinfo.messages.push(message);  
                             chatroomCreatedProfile.recieverinfo.messages.push(message);
                            }else{
                        
                             chatroomCreatedSender.recieverinfo.messages.push(message);
                             chatroomCreatedProfile.senderinfo.messages.push(message);
                            }
                            chatroomCreatedSender.save();
                            chatroomCreatedProfile.save();
                            res.render("chatroom.ejs",{findLoggedInUser:findLoggedInUser,
                            findProfileUser:findProfileUser,
                            chatroomCreatedSender:chatroomCreatedSender,
                            chatroomCreatedProfile:chatroomCreatedProfile
                            })
                                }
                            })
                        }
                    })
                }
            })
        }
    })
})

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    else{
        res.redirect("/");
    }
}

function isLoggedOut(req,res,next){
    if(req.isAuthenticated()){
        res.redirect("/home");
    }else{
        return next();
    }
}

app.listen(process.env.PORT||3000,function(){
    console.log("server has started");
})


