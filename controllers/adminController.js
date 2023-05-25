const { emailUser } = require('../config/config');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');

const randomstring = require('randomstring');
const config = require('../config/config');
const nodemailer = require('nodemailer');

const exceljs = require('exceljs');

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const sendResetPassword = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.password,
      },
    });
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: 'Reset Password',
      html: `<p>Hii ${name}, please click <a href="http://localhost:4000/admin/forget-password?token=${token}">here</a> to reset your password</p>`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email has been sent:', info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addUserMail = async (name, email, password, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.password,
      },
    });
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: 'Admin added you and verified your email',
      html: `<p>Hii ${name}, please click <a href="http://localhost:4000/verify?id=${user_id}">here</a> to verify your email</p> <br> <b>Email:</b> ${email} <br> <b>Password:</b> ${password}`,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message);
      } else {
        console.log('Email has been sent:', info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render('login');
  } catch (error) {
    console.log(error.message);
  }
};


const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData) {
          req.session.user_id = userData._id;
          res.redirect('/admin/home');
        } else {
          res.render('login', { message: 'Email & Password is incorrect' });
        }
      } else {
        res.render('login', { message: 'Email and Password is incorrect' });
      }
    } else {
      res.render('login', { message: 'Email and Password is incorrect' });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashBoard = async (req, res) => {
  const admin = req.session.user_id
  try {
    res.render('home',{admin});
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect('/admin');
  } catch (error) {
    console.log(error.message);
  }
};

const forgetLoad = async (req, res) => {
  try {
    res.render('forget');
  } catch (error) {
    console.log(error.message);
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });

    if (userData) {
      if (userData.is_admin === 0) {
        res.render('forget', { message: 'Email is incorrect' });
      } else {
        const randomString = randomstring.generate();
        await User.updateOne({ email: email }, { $set: { token: randomString } });
        sendResetPassword(userData.name, userData.email, randomString);
        res.render('forget', { message: 'Please check your mail to reset your password' });
      }
    } else {
      res.render('forget', { message: 'Email is incorrect' });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const forgetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });

    if (tokenData) {
      res.render('forget-password', { user_id: tokenData._id });
    } else {
      res.render('404', { message: 'Invalid Link' });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const securePass = await securePassword(password);

    await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: securePass, token: '' } });

    res.redirect('/admin');
  } catch (error) {
    console.log(error.message);
  }
};

const adminDashboard = async (req, res) => {
  try {
    const usersData = await User.find();
    res.render('dashboard', { users: usersData });
  } catch (error) {
    console.log(error.message);
  }
};

const newUserLoad = async (req, res) => {
  try {
    res.render('new-user');
  } catch (error) {
    console.log(error.message);
  }
};

const addUser = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const image = req.file.filename;

    const password = randomstring.generate(8);

    const spassword = await securePassword(password);

    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      image: image,
      password: spassword,
    });
    const userData = await user.save();

    if (userData) {
      addUserMail(name, email, password, userData._id);
      res.redirect('/admin/dashboard');
    } else {
      res.render('new-user', { message: 'Something went wrong' });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });

    if (userData) {
      res.render('edit-user', { user: userData });
    } else {
      res.redirect('/admin/dashboard');
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: { name: req.body.name, email: req.body.email, mobile: req.body.mobile, is_verified: req.body.verify } }
    );

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.log(error.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.deleteOne({ _id: id });
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.log(error.message);
  }
};

const exportUser = async (req, res) => {
  try {
    const Workbook = new exceljs.Workbook();
    const worksheet = Workbook.addWorksheet('My User');

    worksheet.columns = [
      { header: 'S.no', key: 's_no' },
      { header: 'name', key: 'name' },
      { header: 'email', key: 'email' },
      { header: 'mobile', key: 'mobile' },
      { header: 'image', key: 'image' },
      { header: 'is Verified', key: 'is_verified' },
    ];

    let counter = 1;

    const userData = await User.find({ is_admin: 0 });

    userData.forEach((user) => {
      user.s_no = counter;
      worksheet.addRow(user);
      counter++;
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheatml.sheet');
    res.setHeader('Content.Disposition', 'attachment; filename=users.xlsx');

    return Workbook.xlsx.write(res).then(() => {
      res.status(200);
    });
  } catch (error) {
    console.log(error.message);
  }
};

const adminlogin = async(req,res)=>{
 
const admin = {
  email : 'admin@gmail.com',
  password : 'admin',
  name:"Admin",
  mobile:879897878,
  image:'prem.png'

}



  try {
    const {email , password} = req.body;
    if(email === admin.email && password === admin.password){
      req.session.user_id = admin;
      res.render('home',{admin})
    }  else{
      res.send('Invalid email & password')
    }
  } catch (error) {
    console,log(error.message)
  }
}

module.exports = {
  loadLogin,
  verifyLogin,
  loadDashBoard,
  logout,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  adminDashboard,
  newUserLoad,
  addUser,
  editUserLoad,
  updateUser,
  deleteUser,
  exportUser,
  adminlogin
};
