const net = require('net');
const util = require('util');

const serverClient = require('./serverClient');
const parser = require('./parser');
const utils = require('./utils');
const scrubber = require('./scrubber');

function Client(api, options) {
	if (!(this instanceof Client)) {
		return new Client(api, options);
	}
	this.socket = net.connect(options);
	this.socket.on('connect', this.onConnect.bind(this));
	this.socket.on('end', this.onEnd.bind(this));
	this.socket.on('data', utils.onData(this, this.socket, 'onData'));

	this.writable = false;

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
	this._api = api || {};

	this.actions = {};
	this.actions[utils.types.FN_CALL] = this.handleFunctionCall.bind(this);
	this.actions[utils.types.CALLBACK_CALL] = this.scrubber.callback.bind(this.scrubber);
	this.actions[utils.types.END] = this.handleClose.bind(this);
}

util.inherits(Client, serverClient);

Client.prototype.onConnect = function () {
	this.writable = true;
	this.emit('connect', this.remote);
};

Client.prototype.handleClose = function (data) {
	this.writable = false;
};

Client.prototype.onEnd = function () {
	this.writable = false;
	this.emit('disconnect');
};

module.exports = Client;
