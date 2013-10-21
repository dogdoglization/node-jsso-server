(function() {
	var object = new Object();
	object.id = "com.test.example2";
	object.func = function(name) {
		return "Hello " + name + "!";
	};
	return object;
})()