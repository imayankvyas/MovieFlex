var express = require('express');
var path = require('path');
var fs = require('fs');
var bodyParser = require("body-parser");
var port = 3000;

var router = express.Router();
var mongoose = require('mongoose');
var assert = require('assert');
var cookieparser = require('cookie-parser');
const { compile } = require('ejs');

//connect to db
mongoose.connect('mongodb://localhost:27017/users',{
    useNewUrlParser:true,
    useUnifiedTopology:true
});
var db = mongoose.connection;

db.on('error', console.log.bind(console, "connection error"));

db.once('open', function (callback) {
    console.log("connection succeeded");
})

//var um = require('./public/user');
const { isBuffer } = require('util');

//init app
var app = express();
app.use(cookieparser());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

//static files
app.use(express.static('public'));
app.use(express.static('movies'));

//Routing files
router.get('/',function(req, res){
    res.render('index.html');
    
});

app.get('/login', function(req, res){
    res.sendFile(__dirname + '/public/login.html')
});

app.get('/signup',function(req, res){
    res.sendFile(__dirname + '/public/signup.html')
});

app.get('/member',function(req, res){
    res.sendFile(__dirname + '/public/private.html')
});
//form procesing
app.post('/signup', function(req, res){
    var name = req.body.fname;
    var email = req.body.email;
    var password = req.body.password;
    var rpassword = req.body.rpassword;

    var data = {
        "name": name,
        "email": email,
        "password": password,
        "repeat password" : rpassword
    } 
    db.collection('data').insertOne(data, function (err, collection) {
        if (err) throw err;
        console.log("New user added");

    });
    return res.redirect('login.html');
    
});

app.post('/login', function(req, res){
    var email = req.body.email;
    var password = req.body.email;

    var login ={
        "email": email,
        "password": password
    }
    db.collection('login').insertOne(login, function(err , collection){
        if (err) throw err;
        console.log("Login Successful");
    });
    res.cookie(req.body.email, req.body.password);
    return res.redirect('private.html');
})

//video straming
app.get('/video', function (req, res) {
    const path = './sample.mp4'
    const stat = fs.statSync(path)
    const fileSize = stat.size
    const range = req.headers.range

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10)
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1

        const chunksize = (end - start) + 1
        const file = fs.createReadStream(path, { start, end })
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        }

        res.writeHead(206, head)
        file.pipe(res)
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        }
        res.writeHead(200, head)
        fs.createReadStream(path).pipe(res)
    }
})


//start server
app.listen(port, function(){
    console.log('Server started' + port);
}); 
