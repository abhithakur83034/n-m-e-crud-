const http = require('http')
const mongoose = require('mongoose');
const PORT = 4000;


const app = require('./app')

const DBconnection = 'mongodb://127.0.0.1:27017/user_management'


const server = http.createServer(app);



server.listen(PORT,()=>{
    console.log("server started at port :"+PORT);
    mongoose.connect(DBconnection,{
        useNewUrlParser:true,
        useUnifiedTopology:true

    }).then(()=>{
        console.log('Connection Created')

    }).catch((error)=>{
console.log('Error in Connecting with DB'+error)
})
})