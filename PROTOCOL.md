# Protocol

This document describes the protocol that drives this RPC

TL;DR

* JSON based
* Carries server and client ID\`s
* Thats all.

## Format

```json

{
	"type": "Function call", // Action type
	"data": { // All the custom data
		"method": "callMom",
		"arguments": [
		123567879,
		"Dad",
		null
		],
		callbacks: [
		{
			id: 1, // ID in client callbacks map
			position: 2 // Position in arguments Array
		}
		]
	}
}


```

## Flow

Handshake flow looks like this:

```
Connect -> Auth -> Ready
```

Function call flow looks like this
```


```
