const User = require('../models/userModel')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

const config = require('../config/config')


const securePassword = async (password)=>{
    try {
      const passwordHash = await bcrypt.hash(password,10)
      return passwordHash;
    } catch (error) {
        console.log(error.message)
    }
}


// for mail sending................


const sendVerifyMail = async (name,email,user_id)=>{
    try {
     const transporter= nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.password
            }
        });
        const mailOptions ={
            from:config.emailUser,
            to:email,
            subject:'For Verification Mail',
            html:'<p>Hii '+name+',please click here to <a href="http://localhost:4000/verify?id='+user_id+'">Verify</a> Your mail </p>'
        }
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error)
            }else{
                console.log("Email has been sent:-",info.response)
            }
        })
    } catch (error) {
        console.log(error.message)
    }
}

// // end mail sending..............



// for reset password


const sendResetPasswordMail = async (name,email,token)=>{
    try {
     const transporter= nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.password
            }
        });
        const mailOptions ={
            from:config.emailUser,
            to:email,
            subject:'For reset password',
            html:'<p>Hii '+name+',please click here to <a href="http://localhost:4000/forget-password?token='+token+'">Reset </a>your password</p>'
        }
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error)
            }else{
                console.log("Email has been sent:-",info.response)
            }
        })
    } catch (error) {
        console.log(error.message)
    }
}
// end .....


const loadRegister = async(req,res)=>{
    try {
        
        res.render('registration')


    } catch (error) {
        console.log(error.message)
    }
}

// user insert

const insertUser = async (req, res)=>{
    try {
        const spassword = await securePassword(req.body.password);
        const user = new User({
           name:req.body.name,
           email:req.body.email,
           mobile:req.body.mobile,
           image:req.file.filename,
           password:spassword,
        });

      const userData = await user.save();

      if(userData){

        sendVerifyMail(req.body.name,req.body.email,userData._id)


        res.render('registration',{message:"registration successfull...please verify your mail"})
      }else{
        res.render('registration',{message:"registration failed"})
      }


    } catch (error) {
        console.log(error.message)
    }
}

//login user method


const loginLoad = async(req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message)
    }
}

// verify mail


const verifyMail = async(req,res)=>{
    try {
      const updateInfo = await User.updateOne({_id:req.query.id},{$set:{is_verified:1}})
    //   console.log(updateInfo)
      res.render("email-verified")
    } catch (error) {
        console.log(error.message)
    }
}


//verifylogin  

const verifyLogin = async(req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;


     const userData = await User.findOne({email:email})
 
      if(userData){

     const passwordMatch =  await bcrypt.compare(password,userData.password)

     if(passwordMatch){

        if(userData.is_verified === 0){
            res.render('login',{message:"Please verify your email"})
              
        }else{
            req.session.user_id = userData._id;
            res.redirect('/home')
            
        }


     }else{
        res.render('login',{message:"Email and password is incorrect"})
     }

      }else{
        res.render('login',{message:"Email and password is incorrect"})
      }



    } catch (error) {
        console.log(error.message)
    }
}

const loadHome = async(req,res)=>{
    try {
      const userData = await User.findById({_id:req.session.user_id})
        res.render('home',{user:userData})
    } catch (error) {
        console.log(error.message)
    }
}


const userLogout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/')
    } catch (error) {
        console.log(error.message)
    }
}

//forget password

const forgetLoad = async(req,res)=>{
    try {
        res.render('forget')
    } catch (error) {
        console.log(error.message)
    }
}


const forgetVerify = async(req,res)=>{
    try {
        const email = req.body.email;
      const userData = await User.findOne({email:email})
        if(userData){
            if(userData.is_verified === 0){
                res.render('forget',{message:"please verify your mail."})
            }else{
                const randomString = randomstring.generate();
                await User.updateOne({email:email},{$set:{token:randomString}});
                sendResetPasswordMail(userData.name,userData.email,randomString)
                res.render('forget',{message:"please check your mail to reset your password. "})                
            }
            
        }else{
            res.render('forget',{message:"user email is incorrect."})
        }


    } catch (error) {
        console.log(error.message)
    }
}


//  forgetPaasswordLoad Load


const forgetPasswordLoad = async(req,res)=>{
    try {
        const token = req.query.token;
       const tokenData = await User.findOne({token:token})
    //    console.log(tokenData)
       if(tokenData){
        res.render('forget-password',{user_id:tokenData._id})
       }else{
        res.render('404',{message:'Token is invalid.'})
       }
    } catch (error) {
        console.log(error.message)
    }
}



//resetPassword

const resetPassword = async(req,res)=>{
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;


        const secure_password = await securePassword(password)

         await User.findByIdAndUpdate({_id:user_id },
            {$set:{password:secure_password,token:''}});

            res.redirect('/')
    } catch (error) {
        console.log(error.message)
    }
}



//  verification send mail link

const verificationLoad = async(req,res)=>{
    try {
        res.render('verification')
    } catch (error) {
        console.log(error.message)
    }
}



const sentVerificationLink = async(req,res)=>{
    try {
        const email = req.body.email;
        const userData = await User.findOne({email:email})
        if(userData){
            sendVerifyMail(userData.name,userData.email,userData._id)
            res.render('verification',{message:"Reset verification mail is sent to your mail."})
        }else{
            res.render('verification',{message:"email is not exist."})
        }
    } catch (error) {
        console.log(error.message)
    }
}



//user profile edit & update



const editLoad =async(req,res)=>{
    try {
        
        const id = req.query.id;   // when we data from url then we use query
     const userData = await User.findById({_id:id})
   
            if(userData){
                    res.render('edit',{user:userData})
            }else{
                res.redirect('/home')
            }




    } catch (error) {
        console.log(error.message)
    }
}

const updateProfile = async(req,res)=>{
    try {
        if(req.file){
            await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mobile,image:req.file.filename}})

        }else{
         await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mobile}})
        }  
        
        res.redirect('/home')
    } catch (error) {
        console.log(error.message)
    }
}


module.exports = {
    loadRegister,
    insertUser,
    verifyMail,
    verifyLogin,
    loginLoad,
    loadHome,
    userLogout,
   forgetLoad,
   forgetVerify ,
   sendResetPasswordMail,
   forgetPasswordLoad,
   resetPassword,
   verificationLoad,
   sentVerificationLink,
   editLoad,
   updateProfile

};