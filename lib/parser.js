const packer = require('./packer');

const terminator = "\0\0\0\0\0\0";
var processedTerminator = [];
terminator.split('').forEach(function (item) {
	processedTerminator.push(0);
});
processedTerminator = processedTerminator.join('||');

module.exports = function (socket, callback, data) {
	data = Array.prototype.slice.call(data);
	if (!Array.isArray(socket.data)) {
		socket.data = [];
	}
	if (data.join('||').indexOf(processedTerminator) < 0) {
		socket.data = socket.data.concat(data);
		return;
	}
	var splitted = data.join('||').split(processedTerminator);
	splitted.pop();
	splitted.forEach(function (chunk) {
		chunk = chunk.split('||');
		if (chunk[0] === '') {
			chunk.shift();
		} else {
			chunk.pop();
		}
		chunk.forEach(function (item, i) {
			chunk[i] = parseInt(item);
		});
		if (socket.data && socket.data.length > 0 && chunk.length === 0) {
			callback(packer.unpack(socket.data.concat(data)));
			socket.data = [];
			return;
		}
		callback(packer.unpack(chunk));
	});
};

module.exports.terminator = terminator;
