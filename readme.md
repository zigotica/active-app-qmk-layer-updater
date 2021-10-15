# qmk-hid

## What

A small node script that will check the current active app running in your OS, and send the data to a qmk keyboard over raw hid. 

## Why

My [z12 micropad](https://github.com/zigotica/mechanical-keyboards/tree/main/z12) uses 4 layers: vim, browser, figma and terminal (default). I wanted to change layer automatically depending on the main app running in OSX. More often than not, when in Figma I wanted to zoom using the right encoder, but I had left the default layer and the encoder would scroll. This script fixes these issues.

## Dependencies

First requirement is a keyboard running QMK. You have to configure it to use [RAW HID](https://beta.docs.qmk.fm/using-qmk/software-features/feature_rawhid). On the QMK side you will need to add `RAW_ENABLE = yes` in the rules.mk file, and setup the `raw_hid_receive` method in the keymap.c file.

This node script requires [node](https://nodejs.org) and [active-win-cli](https://github.com/sindresorhus/active-win-cli). Since node is probably already installed, just:

```
$ npm install --global active-win-cli
```

`node-hid` should be requested by Node. In case it is not available, run:

```
$ npm install --global node-hid
```

## Setup

The script will check the app and title options of `active-win-cli` every half a second, and send a hex representation of the layer I want to target depending on the app to the micropad, using `node-hid`'s `write` method. I send just a letter in hex format, for instance, 0x56 for 'V'. This will trigger the `raw_hid_receive` method on the QMK, where you can perform `layer_clear();` to clean up previous calls, then `if (data[0] == 'V') { layer_on(_NVIM); }` kind of checks. Example code in keymap.c:

```c
#include "raw_hid.h"

#ifdef RAW_ENABLE
void raw_hid_receive(uint8_t* data, uint8_t length) {
    layer_clear();
    if (data[0] == 'V') {
        layer_on(_NVIM);
    }
    else if (data[0] == 'B') {
        layer_on(_BROW);
    }
    else if (data[0] == 'F') {
        layer_on(_FIGM);
    }
    else {
        layer_on(_TERM);
    }
}
#endif
```

In this case, `write` method sends `V`, `B`, `F` (in hex format) and the enum layers are `_NVIM`, `_BROW`, `_FIGM`, and `_TERM`.

## How to run it

The script checks if there is connection to the device we want to control, using using `node-hid` (we pass just the product name, in this case `z12`, and the default usagePage and usage values). It waits for a connection to be established (it retries every 2s). It also reconnects after disconnection:

```
$ node index.js
```

It can also be called from a cron job.

## Credits

Big thanks to [sindresorhus](https://github.com/sindresorhus/) for the excellent `active-win-cli`, [fauxpark](https://github.com/fauxpark), [precondition](https://github.com/precondition) and [riblee](https://github.com/riblee) for helping me understand node-hid connection, `uint8_t* data` pointer and methods to change layer programmatically.