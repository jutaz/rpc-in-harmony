var net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var packer = require('./packer');
var parser = require('./parser');
var utils = require('./utils');

function Client(api, options) {
	this.connection = net.connect({port: 3000});
	this.connection.on('connect', this.onConnect.bind(this));
	this.connection.on('end', this.onEnd.bind(this));
	this.connection.on('data', parser.bind(undefined, this.connection, this.onData.bind(this)));

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
	this.connection.write(packer.pack(data));
	this.connection.write(parser.terminator);
};

Client.prototype.onData = function (data) {
	var d = packer.unpack(data);
	console.log('here', d);
};

Client.prototype.onEnd = function () {
	console.log('disconnected from server');
};

module.exports = Client;
