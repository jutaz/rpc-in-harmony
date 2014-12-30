var util = require('util');
var EventEmitter = require('events').EventEmitter;

var packer = require('./packer');
var parser = require('./parser');
var utils = require('./utils');

function ServerClient(server, socket) {
	if (!(this instanceof ServerClient)) {
		return new ServerClient(server, socket);
	}
	this.socket = socket;
	this.server = server;
	this.socket.on('data', parser.bind(undefined, socket, this.onData.bind(this)));
}

util.inherits(ServerClient, EventEmitter);

ServerClient.prototype.onData = function (data) {
	var actions = {};
	actions[utils.types.FN_CALL] = this.handleFunctionCall.bind(this);
	utils.actionType(packer.unpack(data), actions);
};

ServerClient.prototype.handleFunctionCall = function (data) {
	utils.processApiCall(this.server._api, data.fn, data.arguments);
};

ServerClient.prototype.write = function (socket, data) {
	this.socket.write(packer.pack(data));
	this.socket.write(parser.terminator);
};



module.exports = ServerClient;
