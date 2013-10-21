###
Author: Andy Ching
Email: dogdoglization@gmail.com
License: MIT
###

exports.start = (options) ->
	webSocketPort = options.port || 8080
	DatabaseFilePath = options.db || null;
	initialJssoDirectory = options.importDir

	emptyFunction = require './empty-function.js'
	ost = require './object-string-transfer.js'
	EvtMgr = new (require './event-manager.js')
	db = new (require './db.js')(DatabaseFilePath, initialJssoDirectory)
	uuid = do () -> #usage uuid() -> <uuid>
		UUID = require('node-uuid')
		() -> UUID.v4()

	#function to generate Cloud class
	#all Cloud instances of the returned Cloud class share the same execution object
	generateCloud = (execution) ->
			
			class Cloud
				#public static members of Cloud Errors
				@ConnectionError: class extends Error
					constructor: (@message = "problem while data transferring") ->
						@name = "CloudConnectionError"
				@ServerError: class extends Error
					constructor: (@message = "an error occur at server") ->
						@name = "CloudServerError"
				@ScriptError: class extends Error
					constructor: (@message = "an problem found inside the server script") ->
						@name = "CloudScriptError"
				@TimeoutError: class extends Error
					constructor: (@message = "function call was timeout") ->
						@name = "CloudTimeoutError"
				@ObjectNotFoundError: class extends ReferenceError
					constructor: (@message = "object is not defined") ->
						@name = "CloudObjectNotFoundError"
				@FunctionNotFoundError: class extends ReferenceError
					constructor: (@message = "function is not defined") ->
						@name = "CloudFunctionNotFoundError"
				
				constructor: (@jssoId, @server) ->
				
				invoke: () ->
					try
						#verify and assign params
						args = Array.prototype.slice.call(arguments)
						if typeof args[0] isnt 'string'
							throw new SyntaxError "The first argument must be the function name in string"
						functionName = args.shift()
						parameter = if typeof args[0] isnt 'function' then (if args[0] instanceof Array then args.shift() else [args.shift()]) else []
						if typeof args[0] isnt 'function'
							throw new SyntaxError "The last parameter must be a callback function"
						onSuccess = args.shift()
						onError = if typeof args[0] is 'function' then args[0] else emptyFunction
						execution.addTask(
							{
								'type': "invoke",
								'id': @jssoId
								'func': functionName
								'args': parameter
							},
							(err, result) -> if err then onError(err) else onSuccess(result)
						)
						return #return nothing
					catch err
						throw err
				
				broadcast: () ->
					#verify and assign params
					args = Array.prototype.slice.call(arguments)
					if typeof args[0] isnt 'string'
						throw new SyntaxError "The first argument must be the function name in string"
					functionName = args.shift()
					
					parameters = if typeof args[0] isnt "function" then (if (originParam = args.shift()) instanceof Array then originParam else [originParam]) else []
					onError = if typeof args[0] is "function" then args.shift() else emptyFunction
					execution.addTask(
						{
							'type': "broadcast",
							'id': @jssoId
							'func': functionName
							'args': parameters
						},
						(err, result) =>
							if (not err) or err instanceof Cloud.FunctionNotFoundError
								try
									listener(result || originParam) for listener in EvtMgr.getEventListeners(@jssoId, functionName)
									return #avoid unnecessary action generate by CoffeeScript
								finally #never be responsed for any failure of listeners
									return
							else
								onError(err)
					)
					return #return nothing
				
				on: (functionName, callback, onError = emptyFunction) ->
					#verify parameters
					if typeof functionName isnt "string" or typeof callback isnt "function" or typeof onError isnt "function"
						throw new SyntaxError "1st argument must be a function name string, 2nd must be a callback"
					#given an client-binding id for recording
					this.listenerId = uuid() if not this.listenerId?
					#register to event manager
					EvtMgr.listenEvent(@jssoId, functionName, this.listenerId, callback)
					return #return nothing
				
				off: (functionName) ->
					if typeof functionName isnt "string"
						throw new SyntaxError "Function name argument must be a string"
					EvtMgr.unlistenEvent(@jssoId, functionName, this.listenerId) if this.listenerId?
					return #return nothing


	class Execution
		constructor: (@onFinish = emptyFunction) ->
			###
			# 3 private variables accessable by this object: Cloud, stack, counter
			# 1 private function accessable by this object: executeTasks
			# 2 object function (as public interfaces) accessing the above members: addTask, run
			# notice that prototype functions CANNOT access these private members,
			# members declared in between class and constructor are accessable by all class instances, also known as private static
			###
			Cloud = generateCloud(this)
			stack = [] #private instance, buffering tasks
			counter = 0 #private instance, counting how many tasks are in processes
			executeTasks = () ->
				while (require = stack.pop()) isnt undefined
					[invokeInfo, callback] = require
					db.get invokeInfo.id, (err, jsso) -> #get jsso to run
						if err
							--counter #one task done, placed before invoking the callback, see * below
							callback(err, null)
						else
							if typeof jsso isnt "object"
								--counter
								callback(new Cloud.ObjectNotFoundError("object <" + invokeInfo.id + "> is not defined"), null)
							else if typeof jsso[invokeInfo.func] isnt "function"
								--counter
								callback(new Cloud.FunctionNotFoundError("function <" + invokeInfo.func + "> is not defined"), null)
							else
								jsso.invokeType = invokeInfo.type
								invokeInfo.args = JSON.parse(invokeInfo.args) if typeof invokeInfo.args is 'string' #turn params string to Array if needed
								if not invokeInfo.args instanceof Array #it should now be a array
									--counter
									callback(new Cloud.ConnectionError "invalided data passed to server function", null)
								else
									#initialize global variables for accessing by jsso
									global.Cloud = Cloud
									global.error = global.response = null
									try
										#if it return a function, assume that it requires low-level operation
										#and then invoke this function with a callback as the only parameter
										#where the callback acceptable two args: err, if any error, and result, the data to return
										#*notice that the "--counter" is placed before callback() since we never know when does callback() invoking
										if typeof (global.response = jsso[invokeInfo.func].apply(jsso, invokeInfo.args)) is "function"
											#place callback to handle the result
											global.response (err, result) ->
												--counter
												callback(global.error = err, global.response = result)
												#pro-process
												if counter is 0 #all tasks are finished and this is the last function call
													onFinish(global.error, global.response) 
													onFinish = emptyFunction #to ensure it call once
												return
											return #wait for invoking the above callback, no futher process
										else
											#handle the result immediately
											--counter
											global.response = callback(null, global.response) || global.response
									catch err
										--counter
										global.error = callback(global.error = err, null) || global.error
						#pro-process
						if counter is 0 #all tasks are finished, and this is the last one
							onFinish(global.error, global.response)
							onFinish = emptyFunction #to ensure it call once
						else if stack.length isnt 0 #there are tasks in stack, try clear them
							executeTasks()
				return #return nothing
			@run = executeTasks
			@addTask = (invokeInfo, callback = emptyFunction) ->
				stack.push([invokeInfo, callback])
				counter++
				this #return this object refer, for convenience


	#pack execution result as output to client
	formOutput = (response, isError, additionalInfo) ->
		if response instanceof Error
			responseType = response.name
			responseMessage = response.message
		else
			responseMessage = switch (responseType = typeof response)
				when "undefined" then null #undefined will not be stringified
				when "string", "number", "boolean" then response
				when "function" then response.toString()
				when "object"
					if response is null
						response
					else
						responseType = "Array" if response instanceof Array
						ost.toString(response);
				else
					responsesType = "ScriptError"
					"Unsupported return type in server script"
		additionalInfo.err = isError
		additionalInfo.type = responseType
		additionalInfo.data = responseMessage
		additionalInfo #return


	webSocketServer = new (require('ws').Server)({port: webSocketPort})
	webSocketServer.on 'connection', (clientws) ->
		clientws.on 'message', (msg) ->
			try
				#trun back to object
				invokeInfo = JSON.parse msg
				#verify data
				if not (typeof invokeInfo?.id is "string" and
				typeof invokeInfo.type is "string" and
				invokeInfo.type.match(/(invoke|broadcast|listen|unlisten)/) and
				typeof invokeInfo.func is "string" and
				if invokeInfo.args then typeof invokeInfo.args is "string" else true)
					clientws.send(JSON.stringify formOutput( #return data error
						new Cloud.ConnectionError "invalided data received by server",
						true, {'ref': invokeinfo.ref, 'evt': "data-error"}))
				
				switch invokeInfo.type
					when "invoke"
						(new Execution((err, result) ->
							clientws.send(JSON.stringify formOutput( #return execution result or error
								err or result, (if err then true else false), {'ref': invokeInfo.ref, 'evt': "invoke"})))
						).addTask(invokeInfo).run()
					when "broadcast"
						(new Execution((err, result) ->
							#simply broadcast the args message if no corresponding function (as handler)
							if (not err) or err.name is "CloudFunctionNotFoundError"
								try
									msg = result || (if invokeInfo.args.length is 1 then invokeInfo.args[0] else invokeInfo.args)
									for listener in EvtMgr.getEventListeners(invokeInfo.id, invokeInfo.func)
										do (listener) -> setTimeout((() -> listener(msg)), 0)
								finally
								clientws.send(JSON.stringify formOutput( #return success to invoker
									"ok", false, {'ref': invokeInfo.ref, 'evt': "broadcast"}))
							else #there is really an error in function code
								clientws.send(JSON.stringify formOutput( #return error to invoker
									err, true, {'ref': invokeInfo.ref, 'evt': "broadcast"})))
						).addTask(invokeInfo).run()
					when "listen"
						#given an client-binding id for recording
						clientws.listenerId = uuid() if not clientws.listenerId?
						#register to event manager
						EvtMgr.listenEvent invokeInfo.id, invokeInfo.func, clientws.listenerId, (message) ->
							clientws.send(JSON.stringify formOutput( #pass mssage to listener
								message, false, {'ref': invokeInfo.ref, 'evt': "message"}))
						#return
						clientws.send(JSON.stringify formOutput(
							"ok", false, {'ref': invokeInfo.ref, 'evt': "listen"}))
					when "unlisten"
						if clientws.listenerId? and EvtMgr.unlistenEvent(invokeInfo.id, invokeInfo.func, clientws.listenerId)
							#return success
							clientws.send(JSON.stringify formOutput(
								"ok", false, {'ref': invokeInfo.ref, 'evt': "unlisten"}))
						else
							#return success with warning: no listener registered before
							clientws.send(JSON.stringify formOutput(
								"no events in listening", false, {'ref': invokeInfo.ref, 'evt': "unlisten"}))
					else #it should not be reached: no corresponding event
						clientws.send(JSON.stringify formOutput( #return data error
							new Cloud.ConnectionError "invalided data received by server",
							true, {'ref': invokeinfo.ref, 'evt': "data-error"}))
			catch err #it should not be reached
				console.log("runtime error: " + err.stack);
				clientws.send(JSON.stringify formOutput( #return, doesn't know what the error is it
					err, true, {'ref': invokeInfo.ref, 'evt': "error"}))
		
		clientws.on 'close', () ->
			#remove all registered listener of the client
			EvtMgr.removeListener clientws.listenerId