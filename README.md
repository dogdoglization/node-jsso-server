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
	&lt;script src="cloud.js"&gt;&lt;/script&gt;
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

to be constructed

## Dependencies
You are required to install the following modules in order to run the server.
1. express
2. node-uuid
3. ws
4. nedb

## installation
to be constructed

## Version
to be constructed

## Licence
MIT
