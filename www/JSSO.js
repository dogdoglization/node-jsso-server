/*
Author: Andy Ching
Email: dogdoglization@gmail.com
License: MIT
*/

(function(global) {
	/* variables declaration */
	var _emptyFunction, CallbackManager, Connections, Connection, JSSO, generateErrorClass;
	
	_emptyFunction = function() {};
	
	/* use to maintain callbacks associated with every function call */
	//register() register callback object and return a id ticket
	//get() retrieve the registered callback object with given id
	//unregister() remove specificed callback object and recycle the id
	CallbackManager = new (function() {
		var 
		//callback map. key: <id>, value: <object containing functions>
		_map = new Object(),
		//internal counter for _IdGenerator()
		_idCounter = 0,
		//generator a id of a call between 0 to JSSO.setting.MaximumCallsWaiting
		_IdGenerator = function() {
			return (_idCounter++ % JSSO.setting.MaximumCallsWaiting).toString();
		};
		
		//register callback functions and return related id
		this.register = function(callbackObject, timeout) {
			/* usage: CallbackManager.register(callbackObject[, timeout])
			 * @callbackObject {object} object that coontains callbacks, no structure limitation
			 * @timeout {Date} callbackObject timeout
			 */
			var id;
			//do until a _map[id] is free to use
			while(_map[(id = _IdGenerator())] !== undefined) {
				//check if it is timeout
				if (((new Date()) - _map[id].createTime) > _map[id].timeout)
					break;
			};
			_map[id] = {
				//structure of each value in map
				"createTime":  new Date(), //the time of registration
				"timeout": timeout,
				"callback": callbackObject //the object to register
			};
			return id;
		};
		//return registered callback with given id
		this.get = function(id) {
			try {
				return _map[id].callback;
			} catch (err) {
				return undefined;
			}
		};
		//unregister a callback
		this.unregister = function(id) {
			delete _map[id];
		};
	})();
	
	/* Connection dictionary */
	//use to maintain different Connection objects for different servers
	//usage: Connection[<wsUrl>] = new Connection(<wsUrl>)
	Connections = new Object();
	
	/* class of websocket connection objects, element of Connections */
	Connection = function(wsUrl) {
		var callStack = new Array(), //buffer of function invokes and broadcasts
		ws = new WebSocket(wsUrl), onWsOpen, onWsMsg, onWsErr,
		flush, rebuildConnection,
		//serverRequiresOfSettingListener:
		//(key: CallbackManager provided id, value: callInfo found in send())
		//store all callInfos from send() which are used to set broadcast event listeners
		//it is used to re-register listeners to server when websocket connection rebuilt
		//the re-registration is performed automatically without user's knowledge
		serverRequiresOfSettingListener = new Object();
		
		// on websocket open event handler
		onWsOpen = _emptyFunction;
		//on websocket message event handler
		onWsMsg = function(event) {
			var result, callback, func;
			try {
				result = JSON.parse(event.data);
				//json format checking
				if (typeof result.err !== "boolean" || typeof result.type !== "string" || result.data === undefined || result.ref === undefined || typeof result.evt !== "string")
					throw new JSSO.ConnectionError("unexpected format of received data: " + event.data);
				//checking pass
				
				//retrieve corresponding callbacks
				callback = CallbackManager.get(result.ref);
				//check callbacks validation
				if (callback === undefined)
					throw new JSSO.TimeoutError("Function call <ref:" + result.ref + "> was timeout");
				//valided callbacks
				
				//pre-process income message 
				switch (result.evt) {
					case "invoke": //return of invoke()
					case "broadcast": //return of broadcast()
					case "unlisten": //return of off()
						//unregister the callbacks as it no longer to be used
						CallbackManager.unregister(result.ref);
						break;
					case "listen": //return of on()
						//intercept this system message
						//as no user-defined handler (and no need) for it
						return;
						break;
					case "message": //received message by someone's broadcast()
						//nothing to do;
						break;
					case "data-error": //server fail to process the require due to data format inconsistency
					case "error":
						throw new JSSO.ConnectionError("unexpected server-side error: " + event.data);
						//TODO: retry?
						break;
					default: //it should not be reached
						throw new JSSO.ConnectionError("unexpected format of received data: " + event.data);
				}
				
				//get corresponding callback function, either success or error
				func = result.err? callback.error : callback.success;
				
				switch (result.type) {
					case 'undefined':
						func();
						break;
					case 'string':
					case 'number':
					case 'boolean':
						func(result.data);
						break;
					case "Array":
						func(JSON.parse(result.data));
						break;
					case 'JSSOScriptError':
						func(new JSSO.ScriptError(result.data));
						break;
					case 'JSSOServerError':
						func(new JSSO.ServerError(result.data));
						break;
					case "JSSOConnectionError":
						func(new JSSO.ConnectionError(result.data));
						break;
					case "JSSOObjectNotFoundError":
						func(new JSSO.ObjectNotFoundError(result.data));
						break;
					case "JSSOFunctionNotFoundError":
						func(new JSSO.FunctionNotFoundError(result.data));
						break;
					default: //object: null or client-customized object type
						if (result.data === null)
							func(result.data);
						else {
							try {
								func(eval("(function(){return " + string + ";}).call(null)"));
								break;
							}
							catch (err) {
								callback.error(new JSSO.ScriptError("Cannot rebuild server-returned object <type: " + result.type + ">."));
							}
							callback.error(new JSSO.ScriptError("Cannot rebuild server-returned object <type: " + result.type + ">."));
						}
				}
			} catch (err) {
				JSSO.onError(err);
			}
		};
		//on websocket error event handler
		onWsErr = function(event) {
			if (ws.readyState === 3) //the connection has been closed or could not be opened
				rebuildConnection();
		};
		
		rebuildConnection = function() { //rebuild the connection while unavailable
			ws.close();
			var times = JSSO.setting.TimesOfConnectionRebuild;
			var rebuild = function() {
				console.log("connection <" + wsUrl +"> rebuilding... " + --times + " times left");
				ws = new WebSocket(wsUrl);
				//set websocket handler
				ws.onopen = (function(callStack, serverRequiresOfSettingListener) {
					return function() {
						console.log("connection rebuilt");
						//put all on() requires into callStack for re-register event listener at server side
						for (var ref in serverRequiresOfSettingListener)
							//listener registration must be placed in fount of other invocation calls
							//in order to listen self-broadcast calls
							callStack.unshift(serverRequiresOfSettingListener[ref]);
						//flush all calls in callStack
						flush();
					};
				})(callStack, serverRequiresOfSettingListener);
				ws.onmessage = onWsMsg;
				ws.onerror = onWsErr;
				setTimeout(function() {
					if (ws.readyState !== 1) {//not established
						if (times > 0) //retry
							rebuild();
						else //rebuild process failed
							JSSO.onError(new JSSO.ConnectionError()); //throw exception to user
					}
				}, JSSO.setting.ConnectionRebuildInterval);
				
				
			};
			rebuild();
		};
		
		//function to handle calls sending
		flush = function() {
			switch (ws.readyState) {
				case 0: //not yet been established
					ws.onopen = function() {
						flush();
					};
					break;
				case 1: //established and communicable
					//send all calls in buffer
					while (callStack.length > 0)
						ws.send(JSON.stringify(callStack.shift()));
					break;
				case 2: //in closing
				case 3: //closed or cannot be opened
				default:
					rebuildConnection();
			}
		};
		
		//interface of sending message to server
		this.send = function(callInfo, successCallback, errorCallback) {
			//register callbacks
			callInfo["ref"] =  CallbackManager.register(
				{"success": successCallback, "error":errorCallback}, 
				(callInfo.type === "listen")? JSSO.setting.MessageListeningTimeout : JSSO.setting.FunctionInvokingTimeout); //set timeout by calling type
			//put into buffer
			callStack.push(callInfo);
			//flush with all calls previously remained
			flush();
			
			//update serverRequiresOfSettingListener when on() or off() call
			if (callInfo.type === "listen")
				serverRequiresOfSettingListener[callInfo.ref] = callInfo;
			else if (callInfo.type === "unlisten")
				delete serverRequiresOfSettingListener[callInfo.ref];
		};
		
		//set websocket handler
		ws.onopen = onWsOpen;
		ws.onmessage = onWsMsg;
		ws.onerror = onWsErr;
	};
	/* end of Connection defination */
	
	/* define the JSSO class */
	JSSO = function(jssoId, server) {
		 /*
		 * usage: new JSSO(jssoid) || new JSSO(jssoid, server)
		 * 
		 * @jssoid {string} the id of JSSO
		 * @server {Object} the server to connect for getting jsso, included host and port, default as JSSO.setting.server, optional
		 */
		 
		/* variables declaration */
		var host, port, currentUrl, conn;
		
		//retrieve host and port if given, default to properties in JSSO.setting.server
		host = (server && server.host)? server.host : JSSO.setting.server.host;
		port = (server && server.port)? server.port : JSSO.setting.server.port;
		
		//retrieve the newest url, since it may be changed by user
		currentUrl = "ws://" + host + ":" + port + "/jsso/ws";
		
		//get the corresponding websocket, else create a new one and cache in Connection;
		conn = Connections[currentUrl] || (Connections[currentUrl] = new Connection(currentUrl));
		
		this.invoke = function() {
			/*
			 * usage: invoke(functionName[, parameters], onSuccess[, onError])
			 * 
			 * @functionName {string} the name of JSSO function to invoke
			 * @parameters {Array} the parameters passed to the function, in form of Array, optional
			 * if there is only one parameter, it can be pass directly instead of wrapping as an Array
			 * @onSuccess {function} the callback for handling return of invoked JSSO function, returned data would be the first argument of the callback
			 * @onError {function} the callback for handling errors during function invocation, an error object would be the 1st argument, optional
			 */
			
			/* variables declaration */
			var args, functionName, parameterArray, successCallback, errorCallback;
			
			//convert function arguments to array as args
			args = Array.prototype.slice.call(arguments);
			
			/* args parsing */
			if (typeof args[0] === "string") {
				//get function name
				functionName = args.shift();
				
				if (typeof args[0] !== "function")
						// parameter was found
						//get parameters
						parameterArray = (args[0] instanceof Array)? args.shift() : [args.shift()];
				
				if (typeof args[0] === "function") {
					/* callback was found, it's a non-blocking call */
					//point successCallback to onSuccess
					successCallback = args.shift();
					//if onError callback exists, point to errorCallback, else point to empty function
					errorCallback = (typeof args[0] === "function")? args.shift() : _emptyFunction;
				}
				else {
					/* no callback found, it's a blocking call */
					throw new SyntaxError("The last argument must be a callback function");
				}
			}
			else
				throw new SyntaxError("The first argument must be the function name in string");
			/* end of args parsing */
			
			conn.send({
				"type": "invoke",
				"id": jssoId,
				"func": functionName,
				"args": JSON.stringify(parameterArray || [])
			}, successCallback, errorCallback);
		};
		
		this.broadcast = function() {
			/*
			 * usage: broadcast(functionName[, parameters][, onError])
			 * 
			 * @functionName {string} the name of JSSO function to invoke
			 * @parameters {Array} the parameters passed to the function, in form of Array object, optional
			 * if there is only one parameter, it can be pass directly instead of wrapping as an Array
			 * @onError {function} the callback for handling errors during function invocation,an  error object would be the 1st argument, optional
			 */
			
			/* variables declaration */
			var args, functionName, parameterArray, errorCallback;
			
			//convert function arguments to array as args
			args = Array.prototype.slice.call(arguments);
			
			if (typeof args[0] === "string") {
				//get function name
				functionName = args.shift();
				//get parameters if any
				parameterArray = (args[0] !== undefined && typeof args[0] !== "function")? (args[0] instanceof Array)? args.shift() : [args.shift()] : [];
				//get error callback if any
				errorCallback = (args[0] !== undefined && typeof args[0] === "function")? args.shift() : _emptyFunction;
				
				//check if wrong use of function
				if (args.length > 0)
					throw new SyntaxError("Parameter array and error handler should be placed correspondingly, if any");
				
				conn.send({
					"type": "broadcast",
					"id": jssoId,
					"func": functionName,
					"args": JSON.stringify(parameterArray)
				}, _emptyFunction, errorCallback);
			}
			else
				throw new SyntaxError("1st argument must be the function name in string");
		};
		
		this.on = function(functionName, callback, onError) {
			if (typeof functionName === "string" && typeof callback === "function") {
				if (onError !== undefined && typeof onError !== "function")
					throw new SyntaxError("3rd argument must be a error handler, if any");
				conn.send({
					"type": "listen",
					"id": jssoId,
					"func": functionName
				}, callback, (onError || _emptyFunction)); //TODO: retry data catching on error
			}
			else
				throw new SyntaxError("1st argument must be a function name string, 2nd must be a callback");
		};
		
		this.off = function(functionName) {
			if (typeof functionName === "string")
				conn.send({ //let server remove listener record
					"type": "unlisten",
					"id": jssoId,
					"func": functionName
				}, _emptyFunction, function() { //retry if any error
					off(functionName);
				});
			else
				throw new SyntaxError("Function name argument must be a string");
		};
	};
	/* end of JSSO defination */
	
	
	/* settings */
	JSSO.setting = {
		"server": { // Server Location Setting
			"host": "localhost",
			"port": 8080
		},
		"MaximumCallsWaiting": Number.MAX_VALUE, //max. number of calls to wait
		"FunctionInvokingTimeout": 30000, //timeout for each invoke(), 30s by default
		"MessageListeningTimeout": 3153600000000, //timeout for each on(), 100yrs by default
		"ConnectionRebuildInterval": 5000, //retry building websocket connection if closed, 5s by default
		"TimesOfConnectionRebuild": 12 //max. number of connection rebuild while failed, 12 times by default
	};
	
	/* user-bindable handler for receiving any macro errors that cannot processed with function invocation callbacks */
	JSSO.onError = function(error) {
		console.log(error.stack);
	};
	
	/* JSSO Errors defination */
	//defination of Error Class generator
	//use to construct JSSO error classes during JSSO building
	generateErrorClass = function(errorName, defaultMessage, parentClass) {
		var error = function(message) {
			this.name = errorName;
			this.message = message || defaultMessage;
		};
		error.prototype = (parentClass && parentClass.prototype instanceof Error? parentClass : Error).prototype;
		return error;
	};
	
	// ConnectionError: problems on websocket connection and data exchange
	JSSO.ConnectionError = generateErrorClass("JSSOConnectionError", "fail to connect with server");
	//ServerError: problems found at server side
	JSSO.ServerError = generateErrorClass("JSSOServerError", "an error occur at server");
	//ServerScriptError: script execution problems reported by the server
	JSSO.ScriptError = generateErrorClass("JSSOScriptError", "an problem found inside the server script");
	//TimeoutError: 1.server script was running over the time limit and was forced to close at server side 
	//				2.event handler was expired and removed, and now cannot handle the event
	JSSO.TimeoutError = generateErrorClass("JSSOTimeoutError", "Function call was timeout");
	//ObjectNotFoundError: specified object (by new JSSO(<object ID>)) cannot be found at server side
	JSSO.ObjectNotFoundError = generateErrorClass("JSSOObjectNotFoundError", "JSSO object is not found", ReferenceError);
	//FunctionNotFoundError: specified function (by invoke() or broadcast()) cannot be found at server side
	JSSO.FunctionNotFoundError = generateErrorClass("JSSOFunctionNotFoundError", "function is not defined", ReferenceError);
	/* end of Errors defination */
	
	//bind the JSSO object to global scope
	global.JSSO = JSSO;
	
	//run user-defined setting placed inside the script tag which endswith "JSSO.js", case-insensitive
	if (document !== undefined) { //check if accessing document is valided
		var scripttags = document.getElementsByTagName("script");
		for (var i in scripttags) {
			var s = scripttags.item(i);
			if (s.hasAttribute("src") && s.getAttribute("src").match(/JSSO.js$/i) && typeof s.textContent === "string" && s.textContent.length > 0)
				//tag was found and it contains script code
				try {
					eval(s.textContent); //run script inside the tag
				} catch (err) {
					console.log(err);
				}
		}
	}
})(this);