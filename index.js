"use strict";

const { spawn } = require('child_process');
var hid = require('node-hid');
var timerID;
const fs = require('fs');
const ARGS = process.argv.slice(2);
const path = ARGS[0] || './config.js';

if (!fs.existsSync(path)) {
  console.log('configuration file needed');
  process.exit();
}

const config = require(path);
const { PRODUCT, TIMERS, VALUES, CONDITIONS, RULES } = config;
let PARSEDCONDITIONS = [];

const isTargetDevice = function(d) {
  return d.product===PRODUCT && d.usagePage===0xFF60 && d.usage===0x61;
}

const conditionsParser = function() {
  let { data } = arguments[0];

  data.forEach((condition, index) => {
    const { id, type } = condition;
    let { lhs, rhs } = condition;
    let fulfilled = false;
    lhs = (typeof lhs === 'number')? lhs : arguments[0][lhs];

    if(typeof rhs !== 'object') rhs = [rhs];
    for(let i=0, l=rhs.length; i<l; i++) {
      const desired = rhs[i];
      if(type === 'contains') {
        fulfilled = lhs.indexOf(desired) > -1;
      } else if(type === 'ends') {
        fulfilled = lhs.substr(-desired.length) === desired;
      } else if(type === 'starts') {
        fulfilled = lhs.substr(desired.length) === desired;
      } else if(type === 'equals') {
        fulfilled = lhs === desired;
      }
      if(fulfilled === true) {
        break;
      }
    }

    PARSEDCONDITIONS[id] = condition;
    PARSEDCONDITIONS[id].fulfilled = fulfilled;
  });
}

const rulesParser = function(CONDITIONS, RULES) {
  let OUTPUT;
  for(let i=0, l=RULES.length; i<l; i++) {
    const rule = RULES[i];
    const { operator, conditions, output } = rule;
    let qualifies = (operator === "and")? 1:0;

    conditions.forEach(condition => {
      const { id, expected } = condition;
      const fulfilled = PARSEDCONDITIONS[id].fulfilled;
      if(operator === 'and') qualifies *= fulfilled;
      if(operator === 'or') qualifies += fulfilled;
      if(!operator) qualifies = fulfilled === expected;
    });

    OUTPUT = output;
    if(!!qualifies) break;
  }

  return OUTPUT;
}

var device;
function connect() {
  var devices = hid.devices();
  var deviceInfo = devices.find( function(d) {return isTargetDevice(d) });

  if( deviceInfo ) {
    device = new hid.HID( deviceInfo.path );

    if(device) {
      device.on('data', function(data) {});

      device.on("error", function(err) {
        device.close();
        clearInterval(timerID);
        connect();
      });

      device.write( [ VALUES['DEFAULT'] ] ); // default layer

      var was = VALUES['DEFAULT'];
      var output;
      var appData;
      var titleData;

      setTimeout( () => {
          timerID = setInterval( () => {
            const aw = spawn('active-win');
            aw.stdout.on('data', (data) => {
              const arr = data.toString().trim().toLowerCase().split('\n');

              appData = arr[2];
              titleData = arr[0];

              conditionsParser({data: CONDITIONS, app: appData, title: titleData});
              output = rulesParser(PARSEDCONDITIONS, RULES);
            });

              if(output && was != output) {
                device.write( [ output ] );
                was = output;
              }
          }, TIMERS.RUNNER);
      },TIMERS.LINK);
    } else {}
  } else {
    setTimeout( () => {
      connect();
    }, TIMERS.RELINK);
  }
}

connect();
