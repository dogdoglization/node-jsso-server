###
Author: Andy Ching
Email: dogdoglization@gmail.com
License: MIT
###

emptyFunction = require './empty-function.js'
ost = require './object-string-transfer.js'

#function to deeply clone js object
cloneObject = (obj) ->
	return obj if obj is null or typeof obj isnt "object"
	newObj = obj.constructor()
	for k, v of obj
		newObj[k] = cloneObject(v)
	return newObj;

###
# the db object to export.
# get: function(id: string, callback: function(error, object)), 
#       pass object to callback acorrding to id
# set: function(id: string, objectOrString: object|string, callback: function(error, object)),
#       save object to db and indexed by id. convert to object if it is a string. pass the object to callback
###
class DB
	constructor: (dbFilePath, initialJssoDir) ->
		nedb = new (require('nedb'))({
			filename: dbFilePath,
			autoload: true})
		
		#create index by id
		nedb.ensureIndex({fieldName: "id"})
		#database cache that boost "get jsso" operation
		cache = {}
		#function to get jsso by id
		get = (id, callback) ->
			callback(new Error "Wrong usage of db.get function", null) if typeof id isnt "string" or typeof callback isnt "function"
			if (obj = cache[id])? #if obj in cache
				callback(null, cloneObject(obj)) #pass a copy of that object
			else #retrieve from db
				nedb.findOne {'id': id}, (err, data) ->
					obj = if data?.src? then ost.toObject(data.src) else null
					cache[data.id] = obj if obj?
					callback(err, obj)
			return #return nothing
		#function to set and save jsso from js object or its string form, indexing by given id
		set = (id, objectOrString, callback) ->
			callback(new Error "Wrong usage of db.set function", null) if typeof id isnt "string" or (objectOrString? and typeof objectOrString isnt "object" and typeof objectOrString isnt "string") or typeof callback isnt "function"
			try
				if typeof objectOrString is "object"
					object = objectOrString
					objectString = ost.toString(objectOrString)
				else
					object = ost.toObject(objectOrString)
					objectString = objectOrString
				nedb.update(
					{"id": id}, #query
					{"id": id, "src": objectString}, #update
					{upsert: true}, #options, insert if object not exists
					(err, numReplaced, upsert) ->
						if err
							callback(err, null)
						else if numReplaced > 1
							cache[id] = object #cache
							callback(new Error "multi-replacement", object)
						else
							cache[id] = object #cache
							callback(null, object))
			catch err
				callback(err, null)
			return #return nothing
		#function to remove jsso, according by id
		removeFromDB = (id, callback) ->
			callback(new Error "Wrong usage of db.delete function", null) if typeof id isnt "string" or typeof callback isnt "function"
			nedb.remove(
				{'id': id},
				{multi: true},
				(err, numRemoved) ->
					if err
						callback(err, "fail")
					else
						delete cache[id]
						callback(null, "success"));
		
		#defination of db administration jsso
		db_jsso = 
			getIdList: () ->
				(id for id, obj of cache)
			,
			getText: (id) ->
				(callback) -> #require low-level operation since it need time to access DB, cannot return immediately
					nedb.findOne {'id': id},
						(err, data) ->
							if err
								callback(err, null)
							else if not data?.src?
								if cache[id]?
									try
										str = ost.toString(cache[id])
									catch err
										callback(new Error("Fail to stringify object"), null)
										return
									callback(null, str)
								else
									callback(new Error "Fail to get the content", null)
							else
								callback(null, data.src)
			,
			save: (id, text) ->
				(callback) ->
					set id, text, (err, obj) ->
						callback(err, if obj? then "success" else "fail")
			,
			remove: (id) ->
				(callback) ->
					removeFromDB(id, callback);
		#set object methods
		@get = get
		@set = set
		@remove = removeFromDB
		#set the default db-admin jsso in cache
		cache["admin.db"] = db_jsso
		
		#if initial jsso folder is given
		if initialJssoDir?
			initialJssoDir = initialJssoDir + "/" if not initialJssoDir.match(/\/$/) #ajust
			#load initial jsso objects from files and cache them if not exist in db
			fs = require "fs"
			fs.readdir initialJssoDir, (err, files) ->
				for fileName in files
					do (fileName) ->
						fs.readFile initialJssoDir+fileName, {encoding: "UTF-8"}, (err, data) ->
							if err
								console.log("fail to load "+fileName+" from directory.")
							else
								try
									jsso = ost.toObject(data)
									id = if typeof jsso.id is "string" then jsso.id else fileName
									get id , (err, obj) ->
										if not obj?
											cache[id] = jsso
											console.log("file \""+fileName+"\" is loaded as <"+id+">.")
										else
											console.log("a newer version of object <"+id+"> defined in file \""+fileName+"\" is found in db.")
								catch err
									console.log("fail to load "+fileName+" from directory: "+err.message)

								
module.exports = DB