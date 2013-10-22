node-jsso-server
================

node-jsso-server is aimed for providing a easy solution of app server programming, which is running upon node.js. It services HTML5 app/website clients the server-side object functions through over websocket.

Concept
-------
node-jsso-server services JavaScript objects (stored in database) as server-side services to the public HTML5 apps/websites over websocket. Each of these objects is simply called JSSO(JavaScript Service Object) in this project; in fact they are just JavaScript objects!

At the server side, you need coding your functions and warp them in a object as JSSO like this:
<pre><code>
	{
		functionName: function(parameter1, parameter2, ...) {
			...
			return data; //data to return, can be in boolean, number, string, array or object format
		},
		functionName2: function() { ...
	}
</code></pre>
You may have your JSSOs as many as you like, and save each of them with a unique ID - named whatever you want in string.

At the client side, you need including the corresponding script file inside HTML doc which localed at "/www/cloud.js" of the project: 
<pre><code>
	<script src="cloud.js"></script>
</code></pre>
then call the server functions like this:
<pre><code>
	var service = new Cloud("your JSSO ID"); //get a stub of JSSO according to given ID
	service.invoke("functionName", //the function name of the JSSO, required
		["optional", "parameters"], //parameters passed to function, in array form, optional
		function onSuccess(dataReceived) { //callback, required
			...
		}, 
		function onError(anyError) {//error handler, optional
			...
		});
</code></pre>

to be continue...

Usage
-----
<to be constructed>

Dependencies
------------
<to be constructed>

installation
------------
<to be constructed>

Version
-------
<to be constructed>

Licence
-------
MIT.
