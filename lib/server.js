const net = require('net');
const util = require('util');
const EventEmitter = require('events').EventEmitter;

const serverClient = require('./serverClient');
const utils = require('./utils');

function Server(api, options) {
	if (!(this instanceof Server)) {
		return new Server(options);
	}
	this.options = options || {};
	this.server = net.createServer();
	this.server.on('connection', this.onConnect.bind(this));
	this.clients = [];
	this._api = api || {};
	this.auth = null;

	if (this.options.auth || typeof this._api.auth !== 'undefined') {
		this.auth = options.auth || this._api.auth;
	}
}

util.inherits(Server, EventEmitter);

Server.prototype.onConnect = function (socket) {
	var index = this.clients.push(serverClient(this, socket)) - 1;
	this.clients[index].on('disconnect', this.emit.bind(this, 'client:disconnect', this.clients[index]));
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

Server.prototype.listen = function () {
	this.server.listen.apply(this.server, utils.argsToArray(arguments));
};

module.exports = Server;
