# active app qmk layer updater

## What

A node script that checks the current active app running in your OS, parses some customizable rules and sends the target layer index to a QMK keyboard over raw hid, so you can change layers programmatically. 

## Why

My [z12 micropad](https://github.com/zigotica/mechanical-keyboards/tree/main/z12) uses 4 layers: vim, browser, figma and default. Encoders do different things on each layer. More often than not, when working in Figma I wanted to zoom using the right encoder, but if I had the default layer active, the encoder would scroll instead. This script fixes this kind of issues, alows me to change layer automatically depending on the main app running in OSX, forgetting about having to manually switch the layer myself. 

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

The script will check the app and title options of `active-win-cli` every half a second, and send to the micropad the index of the layer I want to target depending on the app, using `node-hid`'s `write` method. 

To determine which index to send, we need to parse a set of conditions and rules, which are completely configurable using a simple JSON file. This also allows us to use multiple scripts to target multiple QMK devices at the same time.

The JSON file is an object that containes the product name, timer values for initialization, relink in case of a disconnection and runner (how often we want to check for the current app data). It also holds two objects for conditions and rules.

#### Conditions

CONDITONS is an object that includes one object per condition to be parsed by the rules. 

Each condition has an id, and requires two values and an operator that will calculate if the condition is fulfilled. 

The left hand side value is a reference to the app and title literals that we can send to the parser. 

The right hand value is the string we want to compare. It can also be an array of strings. In that case, for the condition to be fulfilled any of the strings in the array must satisfy the operation.

A condition will return a boolean, being true when it fulfills.

#### Rules

RULES is an array that includes one object per set of conditions. 

Each set of conditions can have one or several conditions. In case of having more than one condition, the operator will define their logic. `or` operator will define that only one of the conditions must be met in order to satisfy the rule. `and` operator  will define that all the conditions must be met in order to satisfy the rule.

Rules are evaluated top down. 

The first rule that satisfies its conditions will break the loop and return the output value. That value is read by the main script and sent to the QMK device (only if it's different from previous cycle). 

If no rule is satisfied, default value defined in the config.json file will be sent to the device. 

### QMK side

On the QMK side you will need to add `RAW_ENABLE = yes` in the rules.mk file. The `write` call from the node script will trigger the `raw_hid_receive` method on the QMK, where you can perform `layer_clear();` to clean up previous calls, then `layer_on(data[0])` to change to layer sent through the stream. 

Note: we are sending `99` when we want to restore default layer (0), apparently `layer_on(data[0])` doesn't work in `raw_hid_receive` when we send `0`.

Example code in keymap.c:

```c
#include "raw_hid.h"

#ifdef RAW_ENABLE
void raw_hid_receive(uint8_t* data, uint8_t length) {
    layer_clear();
    if (data[0] == 99) {
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

Default JSON file is `config.json` but you can use a different one and add its name as an argument to the main call:

```
$ node index.js otherfile.json
```

It can also be called from a cron job.

## To Do

* [x] PoC
* [x] Configuration file
  * [x] Allow different config file path
  * [x] Product name
  * [x] Timers
  * [x] Conditions and Rules
* [x] Extract conditions and rules parsers into external files
* [ ] Documentation
  * [x] Basic use
  * [x] Configuration file
  * [ ] launchd / cron
* [ ] Tests
* [x] Credits

## Credits

Big thanks to [sindresorhus](https://github.com/sindresorhus/) for the excellent `active-win-cli`, [fauxpark](https://github.com/fauxpark), [precondition](https://github.com/precondition) and [riblee](https://github.com/riblee) for helping me understand node-hid connection, `uint8_t* data` pointer and methods to change layer programmatically.
