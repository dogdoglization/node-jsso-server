/*
Author: Andy Ching
Email: dogdoglization@gmail.com
License: MIT
*/

//setup HTTP server for website service
var express = require('express');
var app = express();
app.use(express.static(__dirname + "/www"));
app.listen(80);

//start jsso server
(require('./module/jsso-server.js')).start({
	port: 8080,
	db: "./db/jsso.nedb",
	importDir: "./jsso/"
});

