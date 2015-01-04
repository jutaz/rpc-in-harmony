rpc-in-harmony
==============

RPC for node.js based on --harmony features

#### Quick Example

Server
```js
var Server = require('./lib/server');

var server = new Server({
	fn: function (callback) {
		callback('called');
	}
}, {
	auth: function (str) {
		console.log(str); // Will output 'auth'
		return true; // resolves or rejects auth
	}
});

server.listen(3000);

server.on('client:connect', function (client) {
	client.remote.test(function (test) {
		console.log(test); // Will output 'test'
	});
	setTimeout(function () {
		client.stop();
	}, 1000);
});

```

Client
```js
var Client = require('./lib/client');

var client = new Client({
	test: function (callback) {
		callback('test');
	}
}, {
	port: 3000,
	auth: 'auth'
});

client.on('connect', function (remote) {
	remote.fn(function (a) {
		console.log(a); // Will output 'Called'
	});
});

client.on('disconnect', function () {
	console.log('Disconnected');
});

```
