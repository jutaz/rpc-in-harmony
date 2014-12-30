const net = require('net');
const util = require('util');
const EventEmitter = require('events').EventEmitter;

const parser = require('./parser');
const utils = require('./utils');

function Client(api, options) {
	this.connection = net.connect({port: 3000});
	this.connection.on('connect', this.onConnect.bind(this));
	this.connection.on('end', this.onEnd.bind(this));
	this.connection.on('data', utils.onData(this, this.connection, 'onData'));

	this.remote = Proxy.create({
		get: function (target, method) {
			return function () {
				this.invoke.call(this, method, Array.prototype.slice.call(arguments));
			}.bind(this);
		}.bind(this)
	});
	this._api = api || {};
}

util.inherits(Client, EventEmitter);

Client.prototype.api = function (obj, flushOld) {
	this._api = util._extend((flushOld) ? {} : this._api, obj);
};

Client.prototype.onConnect = function () {

};

Client.prototype.invoke = function (method, args) {
	var data = utils.wrapInType(utils.types.FN_CALL, {
		fn: method,
		arguments: args
	});
	utils.writeToSock(this.connection, data);
};

Client.prototype.onData = function (data) {
	console.log('here', data);
};

Client.prototype.onEnd = function () {
	console.log('disconnected from server');
};

module.exports = Client;
