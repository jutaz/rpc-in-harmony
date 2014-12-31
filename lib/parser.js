const packer = require('./packer');

const terminator = "\0\0\0\0\0\0";
const processedTerminator = '0||0||0||0||0||0';

module.exports = function (socket, callback, data) {
	data = Array.prototype.slice.call(data);
	if (!Array.isArray(socket.data)) {
		socket.data = [];
	}
	if (data.join('||').indexOf(processedTerminator) < 0) {
		socket.data = socket.data.concat(data);
		return;
	}
	if (socket.data && socket.data.length > 0) {
		data = socket.data.concat(data);
		socket.data = [];
	}
	var splitted = data.join('||').split(processedTerminator);
	splitted.forEach(function (chunk, i) {
		chunk = chunk.split('||');
		if (chunk[0] === '') {
			chunk.shift();
		} else {
			chunk.pop();
		}
		chunk.forEach(function (item, i) {
			chunk[i] = parseInt(item);
		});
		if (splitted.length - 1 === i) {
			socket.data = socket.data.concat(data);
			return;
		}
		callback(packer.unpack(chunk));
	});
};

module.exports.terminator = terminator;
