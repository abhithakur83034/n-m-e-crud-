const express = require('express')
const admin_route = express();

const session = require('express-session');
const config = require('../config/config');
admin_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
  }))

const bodyParser = require('body-parser');

admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));



admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');



//  multer

const multer = require('multer');

const path = require('path');


admin_route.use(express.static('public'))


const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/userimages'));
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname
            cb(null,name);
    }
});
const upload = multer({storage:storage})




// multer end
const adminAuth = require('../middleware/adminAuth')


const adminController = require('../controllers/adminController')
admin_route.get('/',adminAuth.isLogout,adminController.loadLogin)


admin_route.post('/',adminController.verifyLogin)


admin_route.get('/home',adminAuth.isLogin,adminController.loadDashBoard)

admin_route.get('/logout',adminAuth.isLogin,adminController.logout)

admin_route.get('/forget',adminAuth.isLogout,adminController.forgetLoad)
admin_route.post('/forget',adminController.forgetVerify)


admin_route.get('/forget-password',adminAuth.isLogout,adminController.forgetPasswordLoad)
admin_route.post('/forget-password',adminController.resetPassword)


admin_route.get('/dashboard',adminController.adminDashboard)



admin_route.get('/new-user',adminAuth.isLogin,adminController.newUserLoad)
admin_route.post('/new-user',upload.single('image'),adminController.addUser)


admin_route.get('/edit-user',adminAuth.isLogin,adminController.editUserLoad)


admin_route.post('/edit-user',adminController.updateUser)

admin_route.get('/delete-user',adminController.deleteUser)


admin_route.get('/export-users',adminAuth.isLogin,adminController.exportUser)

admin_route.post('/login',adminAuth.isLogout,adminController.adminlogin)

admin_route.get('*',function(req,res){     //* work then when we dont get any route
    res.redirect('/admin')             
})

module.exports = admin_route;