var compressjs = require('compressjs');
var algorithm = compressjs.BWTC;
var compressionLevel = 1; // faster.

module.exports.pack = function (data) {
	var toCompress;
	if (typeof data === 'object') {
		toCompress = new Buffer(JSON.stringify(data), 'utf8');
	} else {
		toCompress = new Buffer(data, 'utf8');
	}
	var compressed = algorithm.compressFile(toCompress, undefined, compressionLevel);
	return new Buffer(Array.prototype.slice.call(compressed));
};

module.exports.unpack = function (data) {
	var decompressed = algorithm.decompressFile(data);
	data = new Buffer(decompressed).toString('utf8');
	return JSON.parse(data);
};
