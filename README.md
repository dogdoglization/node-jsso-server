# node-jsso-server

node-jsso-server is aimed for providing a easy approach of app server/client programming, running upon node.js. 
It treats each of different groups of server functions as a JavaScript object and represent it as a object-like stub in your HTML5 script.


## Concept
node-jsso-server services JavaScript objects (stored in internal database) to the HTML5 apps/websites over websocket connection. 
Each of these objects in the server is called JSSO(JavaScript Service Object). In fact they are no different between normal JavaScript objects.
All these objects would be maintained by the JSSO server. you need JSSO.js script file to access these JSSOs.

![alt text](https://raw.github.com/dogdoglization/node-jsso-server/master/readme_resource/architecture_on_web.png "Web view of JSSO server")

JSSO.js provides a stub constructor in which each stub is response to different JSSO on the server.
It would maintains a WebSocket connection for each server; all stub-JSSO links to the server are placed upon this connection.

![alt text](https://raw.github.com/dogdoglization/node-jsso-server/master/readme_resource/how_it_work.png "code view of JSSO usage")

You not only can use JSSOs remotely, but also refer and make calls from other JSSOs under the same server, with the same usage methods.

Besides, JSSO.js would maintain WebSocket connections of different servers automatically. 
Each time a remote call is made but the server is disconnected, it will try rebuilding the WebSocket and then flush all the calls remained at client. 


##Usage
### Define JSSO
A JSSO should be like this:
```JavaScript
{
	functionName: function(parameter1, parameter2, ...) {
		...
		return data; //data to return, can be in boolean, number, string, array or object format
	},
	functionName2: function() { ...
}
```
and saving it with a unique ID/name - just like saving all files under the same folder.
You may have your JSSOs as many as you like, and naming them whatever you want.


Writing JSSO is really easy. For example, naming the following object with ID "my.test":
```JavaScript
{ //Defination of my.test
	hello: function(name) {
		if (!name) throw new Error("name missing.");
		return "Hello " + name + "!";
	}
} //End of my.test
```
Instead of using JSON-like style, you can, but not recommend, contruct JSSO in a function call:
```JavaScript
(function() {
	var jsso = new Object();
	jsso.hello = function(name) {
		if (!name) throw new Error("name missing.");
		return "Hello " + name + "!";
	};
	return jsso;
})()
```
notice that it is a anonymous function call, but not a function declaration.


### Use JSSO
Please includes "JSSO.js" in HTML5 before use. It is placed at "/www/JSSO.js" of the repository: 
```HTML
<script src="JSSO.js"></script>
```
The script will declares a global variable "JSSO", which is used to generate stubs of JSSOs.
A Stub is used to access corresponding JSSO functions on server.
For example, getting a stub of JSSO "my.test" like this:
```JavaScript
var jsso = new JSSO("my.test");
```
In the background, JSSO.js would try building a WebSocket connection to the server asynchronously:
![alt text](https://raw.github.com/dogdoglization/node-jsso-server/master/readme_resource/how_to_get_stub.png "How to get a JSSO stub")


#### Invoke Function
To make invocation, you need specifing at least the function name and a callback for receiving the returned data.
Callback function is required because it is internally a non-blocking asynchronous call:
![alt text](https://raw.github.com/dogdoglization/node-jsso-server/master/readme_resource/how_to_invoke.png "How to invoke function")
However, parameters and error handler are optional for the call.
##### .invoke(functionName:string, parameter:Object, callback:function)
we now can make the function call and handle the data returned using a callback:
```JavaScript
//pass the parameter as the 2nd argument
jsso.invoke("hello", "World", function(data) {
	alert(data);
});

//the server function call would be like this:
//jsso.hello("World");
```
The above is a syntax sugar: directly pass the parameter only if there is one argument for the function.
##### .invoke(functionName:string, parameters:Array, callback:function)
Formally, parameters should wrap in an array like this:
```JavaScript
jsso.invoke("hello", ["World", "Web", "others"], function(data) {
	alert(data);
});

//the server function call would be like this:
//jsso.hello("World", "Web", "others");
```

If there is a function accept only an array as its argument, wrapping must be performed:
```JavaScript
jsso.invoke("hello", [["your", "array", "elements"]], function(data) {
	alert(data);
});

//the server function call would be like this:
//jsso.hello(["your", "array", "elements"]);
```
##### .invoke(functionName:string, callback:function)
If no parameter is required, simply skip it and pass the callback as the 2nd parameter:
```JavaScript
jsso.invoke("hello", function(data) {
	alert(data);
});
```
##### .invoke(functionName:string[, parameter:Object], onSuccess:function[, onError:function])
Any errors found during invoking will be extracted by JSSO server and rebuilt at JSSO.js seamlessly. 
You can append a optional error handler in the call:
```JavaScript
jsso.invoke("hello", 
	function(data) {alert(data);}, 
	function(error) {console.log(error);}
);
jsso.invoke("hello", "World", 
	function(data) {alert(data);}, 
	function(error) {console.log(error);}
);
jsso.invoke("hello", ["World", "Web", "others"], 
	function(data) {alert(data);}, 
	function(error) {console.log(error);}
);
jsso.invoke("hello", [["your", "array", "elements"]], 
	function(data) {alert(data);}, 
	function(error) {console.log(error);}
);
```


#### Broadcast Message
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
jsso.broadcast("hello", "something", function(error) {//error handler, optional
	//handle error here
});
```


### handle Errors
#### Types of Errors
In addition to the JavaScript default error types, there are 6 more errors defined in JSSO constructor:
##### JSSO.ConnectionError
Indicate a problem occurs on the WebSocket connection.
##### JSSO.ServerError
Indicate a error throwed from the server side.
##### JSSO.ScriptError
Indicate a script execution problem found in JSSO.
##### JSSO.TimeoutError
Indicate a remote call timeout. 
It may be a JSSO function running timeout on server, or a data handler at client side is expired and removed.
> the function running period is never limited, so it always be the latter case.

##### JSSO.ObjectNotFoundError
Indicate a required JSSO is not found at the server side.
##### JSSO.FunctionNotFoundError
Indicate a required function is not found in the JSSO.


#### Stub Error handler
Sometime we need handle exceptions that cannot controlled by the error handlers passed in function calls.
For example, JSSO.ConnectionError and JSSO.TimeoutError which may occur anytime.
As the result there is a error handler for each stub:
```JavaScript
var jsso = new JSSO("some.id");
jsso.onError = function(error) { //custom your stub error handler here
	console.log(error.stack); //the default behaviour is to print out the stack
};
```

## Configuration
You may need configuring JSSO setting before use, say, adjust the host and port number:
```JavaScript
JSSO.setting.server.host = "your domain";
JSSO.setting.server.port = 8080; //the port number of the JSSO server, not HTTP server
```
All values of JSSO.setting attributes can be changed, which is an object as following:
```JavaScript
/* default setting */
JSSO.setting = {
	server: { // Server Location Setting
		"host": "localhost",
		"port": 8080
	},
	MaximumCallsWaiting: Number.MAX_VALUE, //max. number of calls in waiting
	FunctionInvokingTimeout: 30000, //timeout for each invoke(), 30 seconds by default
	MessageListeningTimeout: 3153600000000, //timeout for each on(), 100 years by default
	ConnectionRebuildInterval: 10000, //retry building websocket connection if closed, 10 seconds by default
};
```
Configuration can be placed inside the JSSO.js script tag for convenience, but do remember that the src's path must ends with "JSSO.js":
```HTML
<script src="./JSSO.js">
	JSSO.setting.server = {
		host: "your domain",
		port: 8080
	}
</script>
```
>The changed setting will only be applied to the upcoming "new JSSO(...)" constructions. 
>It means that the previous stubs still use the old setting.

You can also change the server info each time when construct a stub:
```JavaScript
var jsso1 = new JSSO("the.jsso.id", {host: "localhost", port: 8080});//apply other host and port
var jsso2 = new JSSO("the.jsso.id", {host: "localhost"});//apply new host only, port remained the same
var jsso3 = new JSSO("the.jsso.id", {port: 8080});//apply other port only, host remained the same
```


## installation
1. install the latest version of [node.js](http://nodejs.org/) (v0.1017+)
2. download the source code of this repository by clicking the "Download ZIP" button at the right of the page
![alt text](https://raw.github.com/dogdoglization/node-jsso-server/master/readme_resource/how_to_download.png "How to download GitHub repository")
3. extract the zip file, there should be an "index.js" file in the root folder
4.  open a console and move to the root directory:
```Shell
$ some\where> cd The\Directory\Of\TheExtracted\Folder
```

5. install all the required modules by command (npm will read package.json for details):
```Shell
$ The\Directory\Of\TheExtracted\Folder> npm install -l
```

6. then start the server by entering "node index.js", like this:
```Shell
$ The\Directory\Of\TheExtracted\Folder> node index.js
```

7. now the JSSO server instance listen on port 8080, and a http server instance listen on port 80
> you can change the ports by modify the code in index.js if any problems about the use of port number on your computer.
8. open a web browser and go to http://localhost/, it is the place for you to control all JSSOs which are found in database.
> do remember that **Do Not Make Any Change Of "admin.db" JSSO** because you need it to access the database, else this web page will be functionless and you will probably get into trouble.


## Dependencies
The following modules are required in order to start the servers:
+ [nedb](https://github.com/louischatriot/nedb/), required by /module/db.js
+ [node-static](https://github.com/cloudhead/node-static), required by /index.js
+ [node-uuid](https://github.com/broofa/node-uuid), required by /module/jsso-server.js
+ [ws](https://github.com/einaros/ws), required by /module/jsso-server.js




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