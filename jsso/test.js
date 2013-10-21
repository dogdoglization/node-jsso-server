{
id: "com.test.example",
func: function() {
	var list = arguments[0] || "client";
	for (var i=1; i<arguments.length; i++)
		list += "," + arguments[i];
	var obj = new this.Cloud("com.test.example2");
	return obj.invoke("func", list, function(data) {
		return data;
	});
	}
}