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
You may also broadcast messages, as well as listen on them:
```JavaScript
var service = new Cloud("your JSSO ID");
service.on("messageName", function onReceived(message) { //listen messages of specified message name from JSSO
	... //handle message
});
service.broadcast("messageName", "message"); //broadcast a message with given message name
service.off("messageName") //unregister the handler of specified message name
```
You may wonder why the message name is required, it is because you can write a message handler at server like this:
```JavaScript
/*server side */
{//your JSSO
	functionName: function(theMessageToBroadcast) {//the broadcast handler, same as other functions
		... //handle this message, do whatever you want
		return messageToAllListeners; //return message that the listeners will received
	}
}

/* client side */
var service = new Cloud("the JSSO ID");
service.on("functionName", function onReceived(message) { //listen messages of specified message name from JSSO
	... //handle message
});
service.broadcast("functionName", "message"); //broadcast a message with given message name
service.off("functionName") //unregister the handler of specified message name
```
and yes, you right, it's just a function call.


to be continue...

## Usage


## Dependencies
You are required to install the following node.js modules in order to start the server:
+ [express](https://github.com/visionmedia/express)
+ [node-uuid](https://github.com/broofa/node-uuid)
+ [ws](https://github.com/einaros/ws)
+ [nedb](https://github.com/louischatriot/nedb/)

## installation
1. install the last version of [node.js](http://nodejs.org/)
2. install all the required modules (see the perious section)
3. download the source code of this repository by clicking the "Download ZIP" button at the right of the page
![alt text](https://raw.github.com/dogdoglization/node-jsso-server/master/readme_resource/how_to_download.png "How to download GitHub repository")
4. extract the zip file, there should be an "index.js" file in the root folder
5. open the system console, change to the root directory, and then start the server by entering "node index.js", like this:
```DOS
C:\Users\YourAccount>cd The\Directory\Of\The\Folder\You\Extract\From\The\ZIP\File

The\Directory\Of\The\Folder\You\Extract\From\The\ZIP\File> node index.js
```

6. now a JSSO server is listen on port 8080, and a http server is listen on port 80
> you can change the listening port by modify the code in index.js if any problems about the use of port number on your computer
7. open a web browser and go to http://localhost/, it is the place for you to control all JSSOs which are found in database.
> do remember that **Do Not Make Any Change Of "admin.db" JSSO** because you need it to access the database, else this web page will be functionless and you will probably get into trouble

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