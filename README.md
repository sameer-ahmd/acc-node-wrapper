# acc-node-wrapper

[Assetto Corsa Compitizione](https://www.assettocorsa.it/competizione/) SDK and Shared Memory implementation for Node.js.

This package allows you to broadcast ACC data across your local network as well as interact with it on the host computer.

## Mode Examples

### Client/Server Mode

This mode allows you to set up a 'server' on the same machine that is running ACC and then pass the data onto different computers in your local network. If you don't want to process any data on the machine that is running ACC then pass in the `forwardOnly` option and processing will be skipped.

In this example the host machine would be passing on ALL of the game data to 192.168.178.43:9001 and that computer would be console.logging the data from the PHYSICS shared memory.

```js
// host machine (server)
// should be a windows computer running ACC
import ACCNodeWrapper from "@pitwall/acc-node-wrapper";

const wrapper = new ACCNodeWrapper();

wrapper.initAsServer({
  name: "ACC",
  address: "localhost",
  password: "asd",
  cmdPassword: "",
  // these are the different addresses on your network to pass the data onto
  forwardAddresses: [{ address: "192.168.178.43", port: 9001 }],
});

wrapper.on("PHYSICS_EVENT", (data) => console.log(data));

wrapper.on("REALTIME_CAR_UPDATE", (data) => console.log(data));
```

```js
// client machine
// in this example the local address of this computer would be 192.168.178.43

import ACCNodeWrapper from "@pitwall/acc-node-wrapper";

const wrapper = new ACCNodeWrapper();

wrapper.initAsClient(9001);

wrapper.on("PHYSICS_EVENT", (data) => console.log(data));
```

If you want to access both shared memory and broadcast API then this is the recommended way to do this. If you don't want to stream the data to the network just don't pass any network address in.

```js
// host machine (server)
// should be a windows computer running ACC
import ACCNodeWrapper from "@pitwall/acc-node-wrapper";

const wrapper = new ACCNodeWrapper();

wrapper.initAsServer({
  name: "ACC",
  address: "localhost",
  password: "asd",
  cmdPassword: "",
});

wrapper.on("PHYSICS_EVENT", (data) => console.log(data));

wrapper.on("REALTIME_CAR_UPDATE", (data) => console.log(data));
```

### Broadcast Mode

This code will work on any machine in your network but does not return any data from shared memory. If you want to run it on a computer not running ACC just change the address to the IP of the computer running ACC

```js
import ACCNodeWrapper from "@pitwall/acc-node-wrapper";

const wrapper = new ACCNodeWrapper();

wrapper.initBroadcastSDK({
  name: "ACC",
  address: "localhost",
  password: "asd",
  cmdPassword: "",
  port: 9000,
});

wrapper.on("REALTIME_CAR_UPDATE", (data) => console.log(data));
```

### Shared Memory Mode

```js
// host machine (server)
// should be a windows computer running ACC
import ACCNodeWrapper from "@pitwall/acc-node-wrapper";

const wrapper = new ACCNodeWrapper();

wrapper.initSharedMemory({
  graphicsUpdateInt: 250,
  physicsUpdateInt: 250,
  staticUpdateInt: 250,
});

wrapper.on("STATIC_EVENT", (data) => console.log(data));
```

Special Thanks

[FynniX](https://github.com/FynniX/) This package is a fork from the original [acc-node-wrapper](https://github.com/FynniX/acc-node-wrapper)
It is 'rewritten' in typescript to allow for intellisense of returned data. It also is designed to not fail when installed on an OS other than windows, although it does not provide full functionality when not on windows with ACC installed on it.

It can also broadcast the results of the shared memory across the local network when running in client/server mode. The use case for this was when the computer running ACC was not also running a dashboard like in Pit Pi

## License

Released under the [MIT License](https://github.com/FynniX/acc-node-wrapper/blob/main/LICENSE).

## Notes

This package is stable and can be used but I will be continuing to build out it's API. You can expect the main APIs not to change in future.
