const parser = require('./parser');
const packer = require('./packer');

const types = {
	FN_CALL: '0x1',
	CALLBACK_CALL: '0x2',
	END: '0x3',
	AUTH: '0x4',
	META: '0x5',
	ERROR: '0x6'
};

function camelCase(input) {
	return input.toLowerCase().replace(/_(.)/g, function(match, group1) {
		return group1.toUpperCase();
	});
}

module.exports.actionType = function (data, obj) {
	var type = data.type;
	for (var i in types) {
		if (type === types[i] && obj[types[i]]) {
			obj[types[i]](data.data);
			return;
		}
	}
};

module.exports.processApiCall = function (target, method, args, callbacks) {
	if (!target[method] && typeof target[method] !== 'function') {
		return false;
	}
	target[method].apply(undefined, args);
	return true;
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

module.exports.createRemoteProxy = function (fn, context) {
	return Proxy.create({
		get: fn.bind(context)
	});
};

module.exports.argsToArray = function (args) {
	return Array.prototype.slice.call(args);
};

for (var i in types) {
	var str = i.toLowerCase();
	str = camelCase(str);
	str = str.charAt(0).toUpperCase() + str.slice(1);
	module.exports['wrapIn' + str + 'Type'] = module.exports.wrapInType.bind(undefined, types[i]);
}

module.exports.types = types;
