// app.js
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var jwt = require("jsonwebtoken");
var bodyParser = require("body-parser");
var util = require('util');
var crypto = require('crypto');
var CryptoJS = require("crypto-js");

var User = require('./models/User');

var database = "test_token";
// db.js
// de co the dung process.env.MONGO_URL tren macos
//terminal -> nano ~/.bash_profile -> export MONGO_URL=mongodb://127.0.0.1:27017 -> ok save
mongoose.connect(process.env.MONGO_URL + '/' + database);

// Handle the connection event
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

db.on('connecting', function () {
    console.log('connecting');
});

db.on('connected', function () {
    console.log('connected!');
});

db.on('reconnected', function () {
    console.log('reconnected');
});

db.once('open', function () {
    console.log('connection open');
});
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

db.on("disconnected", function (err) {
    console.log('Mongoose default connection to DB :' + process.env.MONGO_URL + ' disconnected');
    mongoose.connect(process.env.MONGO_URL, {
        server: {
            auto_reconnect: true,
            socketOptions: {
                keepAlive: 1,
                connectTimeoutMS: 30000
            }
        },
        replset: {
            socketOptions: {
                keepAlive: 1,
                connectTimeoutMS: 30000
            }
        }
    });
});

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, authorization',);
    // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    // res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.post('/authenticate', function (req, res) {
    User.findOne({
        email: req.body.email,
        password: req.body.password
    }, function (err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            if (user) {
                res.json({
                    type: true,
                    data: user,
                    token: user.token
                });
            } else {
                res.json({
                    type: false,
                    data: "Incorrect email/password"
                });
            }
        }
    });
});

app.post('/signin', function (req, res) {
    User.findOne({
        email: req.body.email,
        password: req.body.password
    }, function (err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            if (user) {
                res.json({
                    type: false,
                    data: "User already exists!"
                });
            } else {
                var userModel = new User();
                userModel.email = req.body.email;
                userModel.password = req.body.password;
                userModel.save(function (err, user) {
                    console.log("User : " + user);

                    user.token = jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
                        expiresIn: "2d"
                    });
                    user.save(function (err, user1) {
                        res.json({
                            type: true,
                            data: user1,
                            token: user1.token
                        });
                    });
                });
            }
        }
    })
});

app.post('/me', verifyToken, function (req, res) {
    console.log(req.body);
    
    User.findOne({
        token: req.token
    }, function (err, user) {
        
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            res.json({
                type: true,
                data: user
            });
        }
    });
});

function ensureAuthorized(req, res, next) {
    var bearerToken;
    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.send(403);
    }
}

function verifyToken(req, res, next) {
    var token = req.headers["authorization"];
    console.log(token);
    
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
            // console.log("decoded: " + util.inspect(decoded));

            if (err) { //failed verification.
                return res.json({
                    "error": true
                });
            }
            // req.decoded = decoded;
            req.token = token;
            next(); //no error, proceed
        });
    } else {
        // forbidden without token
        return res.status(403).send({
            "error": true
        });
    }
}

var password = "123456789";

function encrypt(data) {
    try {
        var cipher = crypto.createCipher('aes-256-cbc', password);
        // var crypted = Buffer.concat([cipher.update(buffer),cipher.final()]);
        var encrypted = Buffer.concat([cipher.update(new Buffer(JSON.stringify(data), "utf8")), cipher.final()]);
        return {
            message: "Encrypted!",
            data: encrypted
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

// function decrypt(data) {
//     try {
//         var decipher = crypto.createDecipher("aes-256-cbc", password);
//         console.log(decipher);
        
//         var decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
//         return JSON.parse(decrypted.toString());
//     } catch (error) {
//         throw new Error(error.message);
//     }
// }

function decrypt(data) { 
    var bytes  = CryptoJS.AES.decrypt(data.toString(), password);
    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
}

var data = {
    'username': 'Senji',
    'permission': true,
    'level': 1,
    'vehicle': ['car', 'moto', 'footer'],
    'profile': {
        'home': 1,
        'child': 2,
        'child_name': ['Josh', 'Phil']
    }
};
// var en = encrypt(data);
// console.log(util.inspect(en.data));
// var de = decrypt(en.data);
// console.log('=>>>>>>>>>> : ' + util.inspect(de));


//server
var port = process.env.PORT || 3000;
var server = app.listen(port, function () {
    console.log('Express server listening on port ' + port);
});

app.post('/test', function (req, res) {
    res.json({
        test: "OK"
    });
});