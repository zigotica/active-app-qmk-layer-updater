# qmk-hid

## What

A small node script that will check the current active app running in your OS, and send the data to a qmk keyboard over raw hid. 

## Why

My [z12 micropad](https://github.com/zigotica/mechanical-keyboards/tree/main/z12) uses 4 layers: vim, browser, figma and terminal (default). I wanted to change layer automatically depending on the main app running in OSX. More often than not, when working in Figma I wanted to zoom using the right encoder, but I had the default layer active, the encoder would scroll instead. This script fixes this kind of issues.

## Dependencies

First requirement is a keyboard running QMK, and configure it to use [RAW HID](https://beta.docs.qmk.fm/using-qmk/software-features/feature_rawhid). See example in the section below. 

This node script requires [node](https://nodejs.org), [node-hid](https://github.com/node-hid/node-hid) and [active-win-cli](https://github.com/sindresorhus/active-win-cli). Since node is probably already installed, just:

```
$ npm install --global active-win-cli
```

`node-hid` should be requested by Node. In case it is not available, run:

```
$ npm install --global node-hid
```

## Setup

### Node side

The script will check the app and title options of `active-win-cli` every half a second, and send a hex representation of the layer I want to target depending on the app to the micropad, using `node-hid`'s `write` method. I only send a layer index in hex format, for instance, 0x03 to match the Vim layer (which is the 4th layer in my layers' enum). Note: we are sending 0x42 ('B') when we want to restore default layer (0), apparently layer_on(data[0]) doesn't work in raw_hid_receive when 0x00.

### QMK side

On the QMK side you will need to add `RAW_ENABLE = yes` in the rules.mk file. The `write` call from the node script will trigger the `raw_hid_receive` method on the QMK, where you can perform `layer_clear();` to clean up previous calls, then `layer_on(data[0])` to change to layer sent through the stream. Note the use of 0x42 to check base layer. Example code in keymap.c:

```c
#include "raw_hid.h"

#ifdef RAW_ENABLE
void raw_hid_receive(uint8_t* data, uint8_t length) {
    layer_clear();
    if (data[0] == 0x42) {
        layer_on(_TERM);
    }
    else {
        layer_on(data[0]);
    }
}
#endif
```

## How to run it

The script checks if there is connection to the device we want to control, using using `node-hid` (we pass just the product name, in this case `z12`, and the default usagePage and usage values). It waits for a connection to be established (it retries every 2s). It also reconnects after disconnection:

```
$ node index.js
```

It can also be called from a cron job.

## To Do

* [x] PoC
* [ ] Configuration file
  * [ ] Timers
  * [ ] Rules
  * [ ] Product name
* [ ] Documentation
  * [x] Basic use
  * [ ] Configuration file
  * [ ] launchd / cron
* [ ] Tests
* [x] Credits

## Credits

Big thanks to [sindresorhus](https://github.com/sindresorhus/) for the excellent `active-win-cli`, [fauxpark](https://github.com/fauxpark), [precondition](https://github.com/precondition) and [riblee](https://github.com/riblee) for helping me understand node-hid connection, `uint8_t* data` pointer and methods to change layer programmatically.
