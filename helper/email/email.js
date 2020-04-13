var nodemailer=require("nodemailer");
var User = require("../../models/User");

var transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  auth: {
    user: 'nikhiljindal79@gmail.com',
    pass: 'visca@el@barca'
  }
});

module.exports=transporter;