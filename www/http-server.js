/*
Author: Andy Ching
Email: dogdoglization@gmail.com
License: MIT
*/

//setup HTTP server for website service
connect = require('connect');
connect.createServer(connect.static("./")).listen(80);