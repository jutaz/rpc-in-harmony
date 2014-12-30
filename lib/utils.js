const parser = require('./parser');
const packer = require('./packer');

const types = {
	FN_CALL: '0x1'
};

module.exports.actionType = function (data, obj) {
	var type = data.type;
	for (var i in types) {
		if (type === types[i] && obj[types[i]]) {
			obj[types[i]](data.data);
			return;
		}
	}
};

module.exports.processApiCall = function (target, method, args) {
	if (!target[method] && typeof target[method] !== 'function') {
		// TODO Write error.
		return;
	}
	target[method].apply(undefined, args);
};

module.exports.wrapInType = function (type, data) {
	return {
		type: type,
		data: data
	};
};

module.exports.writeToSock = function (socket, data) {
	socket.write(packer.pack(data));
	socket.write(parser.terminator);
};

module.exports.onData = function (obj, conn, prop) {
	return parser.bind(undefined, conn, obj[prop].bind(obj));
};

module.exports.types = types;
