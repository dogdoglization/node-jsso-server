/*
Author: Andy Ching
Email: dogdoglization@gmail.com
License: MIT
*/

/*
 *Usage:
 *toString(object|array) -> string, turn a JavaScript object or array into string, function will be stringified also
 *toObject(string) -> object, rebuild a JavaScript object from its string representation
*/

var toString, toObject;

toString = function(obj) {
	var opening_parenthesis, closing_parenthesis, toElement, elements, k, v;
	if (obj instanceof Array) {
		opening_parenthesis = "[";
		closing_parenthesis = "]";
		toElement = function(index, value) {return value;};
	}
	else {
		opening_parenthesis = "{";
		closing_parenthesis = "}";
		toElement = function(index, value) {return index + ":" + value;};
	}
	
	elements = new Array();
	for (k in obj) {
		v = obj[k];
		elements.push(toElement(k, (function() {
		switch (typeof v) {
			case "object":
				return toString(v);
			case "string":
				return "\"" + v + "\"";
			default:
				return v.toString();
		}
		})()));
	}
	return opening_parenthesis + elements.join(",") + closing_parenthesis;
};

toObject = function(string) {
	return eval("(function(){return " + string + ";}).call(null)");
};

module.exports.toString = toString;
module.exports.toObject = toObject;