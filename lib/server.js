var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var packer = require('./packer');
var parser = require('./parser');
var serverClient = require('./serverClient');

function Server(api, options) {
	if (!(this instanceof Server)) {
		return new Server(options);
	}
	this.options = options;
	this.server = net.createServer();
	this.server.on('connection', this.onConnect.bind(this));
	this.clients = [];
	this._api = api || {};
	this.remote = Proxy.create({
		get: function (target, method) {
			return function () {
				this.invoke.call(this, method, Array.prototype.slice.call(arguments));
			}.bind(this);
		}.bind(this)
	});
}

util.inherits(Server, EventEmitter);

Server.prototype.invoke = function (method, args) {
	var data = utils.wrapInType(utils.types.FN_CALL, {
		fn: method,
		arguments: args
	});
	this.connection.write(packer.pack(data));
	this.connection.write(parser.terminator);
};

Server.prototype.onConnect = function (socket) {
	var index = this.clients.push(serverClient(this, socket)) - 1;
	this.emit('client:connect', this.clients[index]);
};

Server.prototype.stop = function (socket) {
	this.clients.forEach(function (client) {
		client.stop();
	});
};

Server.prototype.api = function (obj, flushOld) {
	this._api = util._extend((flushOld) ? {} : this._api, obj);
};

Server.prototype.listen = function (port) {
	this.server.listen(port);
};

module.exports = Server;
