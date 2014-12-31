const util = require('util');
const EventEmitter = require('events').EventEmitter;

const parser = require('./parser');
const utils = require('./utils');
const scrubber = require('./scrubber');

function ServerClient(server, socket) {
	if (!(this instanceof ServerClient)) {
		return new ServerClient(server, socket);
	}
	this.socket = socket;
	this.server = server;
	this.socket.on('data', utils.onData(this, this.socket, 'onData'));

	this.writable = true;
	this._api = this.server._api;

	this.scrubber = new scrubber(this.socket);

	this.remote = utils.createRemoteProxy(function (target, method) {
		if (!this.writable) {
			this._error('Connection is not writable. Maybe it is closed or not yet open?');
			return;
		}
		return function () {
			this.invoke.call(this, method, this.scrubber.scrub(arguments));
		}.bind(this);
	}, this);
}

util.inherits(ServerClient, EventEmitter);

ServerClient.prototype.stop = function () {
	this.writable = false;
	var data = utils.wrapInType(utils.types.END);
	utils.writeToSock(this.socket, data);
	this.socket.end();
};

ServerClient.prototype.invoke = function (method, scrubbed) {
	var data = utils.wrapInType(utils.types.FN_CALL, {
		fn: method,
		arguments: scrubbed.args,
		callbacks: scrubbed.callbacks
	});
	utils.writeToSock(this.socket, data);
};

ServerClient.prototype._error = function (err) {
	var error = new Error(err);
	if (EventEmitter.listenerCount('error') > 0) {
		this.emit('error', error);
	} else {
		throw error;
	}
};

ServerClient.prototype.onData = function (data) {
	var actions = {};
	actions[utils.types.FN_CALL] = this.handleFunctionCall.bind(this);
	actions[utils.types.CALLBACK_CALL] = this.scrubber.callback.bind(this.scrubber);
	utils.actionType(data, actions);
};

ServerClient.prototype.handleFunctionCall = function (data) {
	var args = this.scrubber.unscrub(data.arguments, data.callbacks);
	utils.processApiCall(this._api, data.fn, args);
};

module.exports = ServerClient;
