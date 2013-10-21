/*
Author: Andy Ching
Email: dogdoglization@gmail.com
License: MIT
*/

var EventManager = function() {
	var _map, _rowIndex, _colnumIndex;
	_map = new Object(); //event-listener mapping
	_rowIndex = new Object(); //index for events (event object + event name)
	_colnumIndex = new Object(); //index for listener object
	
	this.listenEvent = function(eventObjectId, eventName, listenerObjectId, listenerCallback) {
		var eventId = eventObjectId + ":" + eventName;
		var mapId = eventId + "|" + listenerObjectId;
		
		_map[mapId] = listenerCallback; //registering into map
		
		//indexing by event id
		if (_rowIndex[eventId])
			_rowIndex[eventId].push(mapId);
		else
			_rowIndex[eventId] = [mapId];
		
		//indexing by listener object id
		if (_colnumIndex[listenerObjectId])
			_colnumIndex[listenerObjectId].push(mapId);
		else
			_colnumIndex[listenerObjectId] = [mapId];
	};
	this.unlistenEvent = function(eventObjectId, eventName, listenerObjectId) {
		var eventId = eventObjectId + ":" + eventName;
		var mapId = eventId + "|" + listenerObjectId;
		
		if (_map[mapId]) {
			delete _map[mapId];
			_rowIndex[eventId].splice(_rowIndex[eventId].indexOf(mapId), 1);
			_colnumIndex[listenerObjectId].splice(_colnumIndex[listenerObjectId].indexOf(mapId), 1);
			return true;
		}
		else
			return false;
	};
	this.removeListener = function(listenerObjectId) {
		var i, mapIds = _colnumIndex[listenerObjectId];
		
		//for each registered callback id
		for (i in mapIds) {
			var mapId = mapIds[i];
			var eventId = mapId.substring(0, mapId.lastIndexOf("|"));
			//remove record in event index
			_rowIndex[eventId].splice(_rowIndex[eventId].indexOf(mapId), 1);
			//remove listener callback from map
			delete _map[mapId];
		}
		
		//remove record in listener index
		delete _colnumIndex[listenerObjectId];
	};
	this.getEventListeners = function(eventObjectId, eventName) {
		var mapIds = _rowIndex[eventObjectId + ":" + eventName], listeners = new Array();
		for (i in mapIds)
			listeners.push(_map[mapIds[i]]);
		return listeners;
	};
};

module.exports = EventManager;