/*
Author: Andy Ching
Email: dogdoglization@gmail.com
License: MIT
*/

(require('./module/jsso-server.js')).start({
	port: 8080,
	db: "./db/jsso.nedb",
	importDir: "./jsso/"
});

//setup HTTP server for website service
connect = require('connect')
connect.createServer(connect.static("./www")).listen(80)