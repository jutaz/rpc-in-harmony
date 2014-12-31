const utils = require('./utils');

function scrubber(socket) {
	this.callbacks = [];
	this.socket = socket;
}

scrubber.prototype.callback = function (data) {
	this.callbacks[data.id].apply(undefined, data.arguments);
};

scrubber.prototype.scrub = function (args) {
	var res = {
		args: [],
		callbacks: {}
	};
	args = utils.argsToArray(args);
	args.forEach(function (arg, pos) {
		if (typeof arg !== 'function') {
			res.args.push(arg);
			return;
		}
		res.args.push(null);
		res.callbacks[pos] = {
			id: this.callbacks.push(arg) - 1
		};
	}, this);
	return res;
};

scrubber.prototype.unscrub = function (args, callbacks) {
	var res = [];
	args.forEach(function (arg, i) {
		if (arg !== null && !callbacks[i]) {
			res.push(arg);
			return;
		}
		res.push(function () {
			data = utils.wrapInType(utils.types.CALLBACK_CALL, {
				id: this.id,
				arguments: utils.argsToArray(arguments)
			});
			utils.writeToSock(this.socket, data);
		}.bind({
			id: callbacks[i].id,
			socket: this.socket
		}));
	}, this);
	return res;
};

module.exports = scrubber;
