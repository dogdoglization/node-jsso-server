# node-jsso-server

node-jsso-server is aimed for providing a easy solution of app server programming, which is running upon node.js. It services HTML5 app/website clients the server-side object functions through over websocket.

## Concept
node-jsso-server services JavaScript objects (stored in database) as server-side services to the public HTML5 apps/websites over websocket. Each of these objects is simply called JSSO(JavaScript Service Object) in this project; in fact they are just JavaScript objects.

At the server side, you should code your functions in a object as JSSO like this:
```JavaScript
{
	functionName: function(parameter1, parameter2, ...) {
		...
		return data; //data to return, can be in boolean, number, string, array or object format
	},
	functionName2: function() { ...
}
```
and then save the JSSO in database with a unique ID - just like saving a file and given it a file name.
You may have your JSSOs as many as you like, and naming them whatever you want.

At the client side, you need including the corresponding script file inside HTML doc which localed at "/www/cloud.js" of the project: 
```HTML
<script src="cloud.js"></script>
```
then call the server functions like this:
```JavaScript
var service = new Cloud("your JSSO ID"); //get a stub of JSSO according to given ID
service.invoke("functionName", //the function name of the JSSO, required
	["optional", "parameters"], //parameters passed to function, in array form, optional
	function onSuccess(dataReceived) { //callback, required
		...
	}, 
	function onError(anyError) {//error handler, optional
		...
	});
```

to be continue...

## Usage


## Dependencies
You are required to install the following modules in order to run the server.
+ [express](https://github.com/visionmedia/express)
+ [node-uuid](https://github.com/broofa/node-uuid)
+ [ws](https://github.com/einaros/ws)
+ [nedb](https://github.com/louischatriot/nedb/)

## installation


## Licence
The MIT Licence (MIT) [http://opensource.org/licenses/mit-license.php](http://opensource.org/licenses/mit-license.php)

Copyright (c) 2013 Andy Ching <dogdoglization@gmail.com>

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