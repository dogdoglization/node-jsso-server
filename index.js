/*
Author: Andy Ching
Email: dogdoglization@gmail.com
License: MIT
*/

//start HTTP server for admin website: http://localhost/
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        (new (require('node-static')).Server("./www")).serve(request, response);
    }).resume();
}).listen(80);
/*start HTTP server using express:
//var express = require('express');
//var app = express();
//app.use(express.static(__dirname + "/www"));
//app.listen(80);
*/

//start jsso server
(require('./module/jsso-server.js')).start({
	port: 8080,
	db: "./db/jsso.nedb",
	importDir: "./jsso/"
});

