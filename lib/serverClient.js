const util = require('util');
const EventEmitter = require('events').EventEmitter;

const parser = require('./parser');
const utils = require('./utils');

function ServerClient(server, socket) {
	if (!(this instanceof ServerClient)) {
		return new ServerClient(server, socket);
	}
	this.socket = socket;
	this.server = server;
	this.socket.on('data', utils.onData(this, this.socket, 'onData'));
}

util.inherits(ServerClient, EventEmitter);

ServerClient.prototype.onData = function (data) {
	var actions = {};
	actions[utils.types.FN_CALL] = this.handleFunctionCall.bind(this);
	utils.actionType(data, actions);
};

ServerClient.prototype.handleFunctionCall = function (data) {
	utils.processApiCall(this.server._api, data.fn, data.arguments);
};

module.exports = ServerClient;
