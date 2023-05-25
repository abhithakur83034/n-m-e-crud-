const express = require('express')
const app = express();

// for user route


const userRoute = require('./routes/userRoute')
app.use('/',userRoute)


// for admine route


const adminRoute = require('./routes/adminRoute')
app.use('/admin',adminRoute)




module.exports = app;