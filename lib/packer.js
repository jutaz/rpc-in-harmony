module.exports.pack = function (data) {
	return new Buffer(JSON.stringify(data));
};

module.exports.unpack = function (data) {
	var str = new Buffer(data).toString();
	try {
		return JSON.parse(str);
	} catch (e) {
		return false;
	}
};
