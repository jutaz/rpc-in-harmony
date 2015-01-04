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
	this.auth = this.server.auth;
	this.authed = (!this.auth);

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

	this.actions = {};
	this.actions[utils.types.FN_CALL] = this.handleFunctionCall.bind(this);
	this.actions[utils.types.CALLBACK_CALL] = this.scrubber.callback.bind(this.scrubber);
	this.actions[utils.types.ERROR] = this._error.bind(this);
	this.actions[utils.types.AUTH] = this.auth.bind(this);
}

util.inherits(ServerClient, EventEmitter);

ServerClient.prototype.stop = function () {
	this.writable = false;
	var data = utils.wrapInEndType();
	utils.writeToSock(this.socket, data);
	this.socket.end();
};

ServerClient.prototype.invoke = function (method, scrubbed) {
	var data = utils.wrapInFnCallType({
		fn: method,
		arguments: scrubbed.args,
		callbacks: scrubbed.callbacks
	});
	utils.writeToSock(this.socket, data);
};

ServerClient.prototype._error = function (err) {
	var error = new Error(err.message || err);
	if (EventEmitter.listenerCount(this, 'error') > 0) {
		this.emit('error', error);
	} else {
		throw error;
	}
};

ServerClient.prototype.onData = function (data) {
	if (data === false || typeof data !== 'object') {
		utils.writeToSock(this.socket, utils.wrapInErrorType({
			message: 'Got invalid data.'
		}));
		return;
	}
	if (this.auth && !this.authed && this.actions[utils.types.AUTH]) {
		if (!data.type || data.type !== utils.types.AUTH) {
			utils.writeToSock(this.socket, utils.wrapInErrorType({
				message: 'Auth is required.'
			}));
			return;
		}
		if (this.actions[utils.types.AUTH].length > 1) {
			this.actions[utils.types.AUTH](data.data.auth, function (val) {
				this.authed = val;
			}.bind(this));
		} else {
			this.authed = this.actions[utils.types.AUTH](data.data.auth);
		}
		return;
	}
	utils.actionType(data, this.actions);
};

ServerClient.prototype.handleFunctionCall = function (data) {
	var args = this.scrubber.unscrub(data.arguments, data.callbacks);
	var isOk = utils.processApiCall(this._api, data.fn, args);
	if (!isOk) {
		utils.writeToSock(this.socket, utils.wrapInErrorType({
			message: 'No such method - ' + data.fn + '.'
		}));
	}
};

module.exports = ServerClient;
