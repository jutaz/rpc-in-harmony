const net = require('net');
const util = require('util');
const EventEmitter = require('events').EventEmitter;

const parser = require('./parser');
const utils = require('./utils');
const scrubber = require('./scrubber');

function Client(api, options) {
	this.connection = net.connect({port: 3000});
	this.connection.on('connect', this.onConnect.bind(this));
	this.connection.on('end', this.onEnd.bind(this));
	this.connection.on('data', utils.onData(this, this.connection, 'onData'));

	this.writable = false;

	this.scrubber = new scrubber(this.connection);

	this.remote = utils.createRemoteProxy(function (target, method) {
		if (!this.writable) {
			this._error('Connection is not writable. Maybe it is closed or not yet open?');
			return;
		}
		return function () {
			this.invoke.call(this, method, this.scrubber.scrub(arguments));
		}.bind(this);
	}, this);
	this._api = api || {};
}

util.inherits(Client, EventEmitter);

Client.prototype.api = function (obj, flushOld) {
	this._api = util._extend((flushOld) ? {} : this._api, obj);
};

Client.prototype.onConnect = function () {
	this.writable = true;
	this.emit('connect', this.remote);
};

Client.prototype.invoke = function (method, scrubbed) {
	var data = utils.wrapInType(utils.types.FN_CALL, {
		fn: method,
		arguments: scrubbed.args,
		callbacks: scrubbed.callbacks
	});
	utils.writeToSock(this.connection, data);
};

Client.prototype.onData = function (data) {
	var actions = {};
	actions[utils.types.FN_CALL] = this.handleFunctionCall.bind(this);
	actions[utils.types.CALLBACK_CALL] = this.scrubber.callback.bind(this.scrubber);
	actions[utils.types.END] = this.handleClose.bind(this);
	utils.actionType(data, actions);
};

Client.prototype.handleFunctionCall = function (data) {
	var args = this.scrubber.unscrub(data.arguments, data.callbacks);
	utils.processApiCall(this._api, data.fn, args);
};

Client.prototype.handleClose = function (data) {
	this.writable = false;
};

Client.prototype._error = function (err) {
	var error = new Error(err);
	if (EventEmitter.listenerCount('error') > 0) {
		this.emit('error', error);
	} else {
		throw error;
	}
};

Client.prototype.onEnd = function () {
	this.writable = false;
	this.emit('disconnect');
};

module.exports = Client;
