# node-jsso-server

node-jsso-server is aimed for providing a easy approach of app server/client programming, running upon node.js. 
It treats each of different groups of server functions as a JavaScript object and represent it as a object-like stub in your HTML5 script.

## Concept
node-jsso-server services JavaScript objects (stored in internal database) to the HTML5 apps/websites over websocket connection. 
Each of these objects in the server is called JSSO(JavaScript Service Object). In fact they are no different than normal JavaScript objects.
All these objects would be maintained by the JSSO server; you can access them remotely through using the "JSSO" constructor which is defined in JSSO.js script file.
![alt text](https://raw.github.com/dogdoglization/node-jsso-server/master/readme_resource/architecture_on_web.png "Web view of JSSO server")

### Server Side
Writing JSSO is really easy. For example, naming the following object with ID "my.test":
```JavaScript
{ //Defination of my.test JSSO
	hello: function(name) {
		return "Hello " + name + "!";
	}
} //End of my.test
```
At the server side, you should write your JSSOs like this:
```JavaScript
{
	functionName: function(parameter1, parameter2, ...) {
		...
		return data; //data to return, can be in boolean, number, string, array or object format
	},
	functionName2: function() { ...
}
```
Please save each JSSO with a unique ID/name - just like saving all files under the same folder.
You may have your JSSOs as many as you like, and naming them whatever you want.

### Client Side
Please include "JSSO.js" before use, it is placed at "/www/JSSO.js" of the repository: 
```HTML
<script src="JSSO.js"></script>
```
The script will declares a global variable "JSSO", which is used to generate stubs of JSSOs.
A Stub is used to access corresponding JSSO functions on server.
For example, You can get a stub of JSSO "my.test" like this:
```JavaScript
var jsso = new JSSO("my.test");
```
In the background, JSSO.js would try building a WebSocket connection to the server asynchronously:
![alt text](https://raw.github.com/dogdoglization/node-jsso-server/master/readme_resource/how_to_get_stub.png "How to get a JSSO stub")

You now can make the function call and handle the data returned using a callback:
```JavaScript
jsso.invoke("hello", "World", function(data) {//here is a syntax sugar
	alert(data);
});
//formally, parameters should wrap in a array
jsso.invoke("hello", ["World"], function(data) {
	alert(data);
});
//for two or more parameters, it is good for reading
jsso.invoke("hello", ["World", "Web"], function(data) {
	alert(data);
});
```
Even it looks ugly, a callback function is required because it is a non-blocking asynchronous call internally:
![alt text](https://raw.github.com/dogdoglization/node-jsso-server/master/readme_resource/how_to_invoke.png "How to invoke function")

You can also broadcast messages using similar approach:
```JavaScript
jsso.broadcast("notice", "It's a test!");
```
The above script attempts broadcasting the message "It's a test!" with the name "notice" through my.test JSSO.
On the other hand, to listen these messages at other app instances you should:
```JavaScript
var jsso = new JSSO("my.test"); //get a new stub of the same JSSO first
jsso.on("notice", function(data) { //listen messages with the the name "notice"
	alert(data);
});
```
You can unregister listener anytime by calling off() function:
```JavaScript
jsso.off("notice"); //unlisten to messages with the name "notice"
```
In addition, you can process the message in JSSO before broadcasting, in which the name of the handler function should be the same as messages' name.
For example, we can reuse the function of my.test as the handler like this:
```JavaScript
jsso.broadcast("hello", "user, this is broadcast message");
```
This message would be passed as the parameter of the function and JSSO server will broadcast the result of the function, instead of the message itself:
```JavaScript
jsso.on("hello", function(data) {
	alert(data); //get "hello user, this is broadcast message!"
});
```
![alt text](https://raw.github.com/dogdoglization/node-jsso-server/master/readme_resource/how_to_broadcast.png "How to broadcast message")
Optionally, you can handle any error occurred during message proccessing, in which a error handler is required:
```JavaScript
jsso.broadcast("hello", "something", function(error) {
	//handle error here
});
```

## API
TO BE CONSTRUCT...
### Configuration

### Usage - JSSO.js
```JavaScript
service.invoke("functionName", //the function name of the JSSO, required
	["optional", "parameters"], //parameters passed to function, in array form, optional
	function onSuccess(dataReceived) { //callback, required
		...
	}, 
	function onError(anyError) {//error handler, optional
		...
	});
```


## Dependencies
You are required to install the following node.js modules in order to start the servers:
+ [nedb](https://github.com/louischatriot/nedb/), required by /module/db.js
+ [node-static](https://github.com/cloudhead/node-static), required by /index.js
+ [node-uuid](https://github.com/broofa/node-uuid), required by /module/jsso-server.js
+ [ws](https://github.com/einaros/ws), required by /module/jsso-server.js

You can install them by using npm in console:
```Shell
$ npm install <dependency>
```

## installation
1. install the latest version of [node.js](http://nodejs.org/) (v0.1017+)
2. install all the required modules (see the previous section)
3. download the source code of this repository by clicking the "Download ZIP" button at the right of the page
![alt text](https://raw.github.com/dogdoglization/node-jsso-server/master/readme_resource/how_to_download.png "How to download GitHub repository")
4. extract the zip file, there should be an "index.js" file in the root folder
5. open the system console, move to the root directory, and then start the server by entering "node index.js", like this:
```Shell
$ C:\Users\YourAccount> cd The\Directory\Of\TheExtracted\Folder
$ The\Directory\Of\TheExtracted\Folder> node index.js
```

6. now the JSSO server instance listen on port 8080, and a http server instance listen on port 80
> you can change the ports by modify the code in index.js if any problems about the use of port number on your computer.
7. open a web browser and go to http://localhost/, it is the place for you to control all JSSOs which are found in database.
> do remember that **Do Not Make Any Change Of "admin.db" JSSO** because you need it to access the database, else this web page will be functionless and you will probably get into trouble.

## Licence
The MIT Licence (MIT) [http://opensource.org/licenses/mit-license.php](http://opensource.org/licenses/mit-license.php)

Copyright (c) 2013 Andy Ching &lt;dogdoglization@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.