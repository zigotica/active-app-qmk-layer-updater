"use strict";

const { spawn } = require('child_process');
var hid = require('node-hid');
var timerID;
const fs = require('fs');
const ARGS = process.argv.slice(2);
const path = ARGS[0] || './config.json';

if (!fs.existsSync(path)) {
  console.log('configuration file needed');
  process.exit();
}

const configfile = fs.readFileSync(path);
const config = JSON.parse(configfile);

const { rulesParser } = require('./rules-parser.js');
const { PRODUCT, TIMERS, VALUES, CONDITIONS, RULES } = config;

const isTargetDevice = function(d) {
  return d.product===PRODUCT && d.usagePage===0xFF60 && d.usage===0x61;
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
      var wasApp = '';
      var wasTitle = '';
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

              if(wasApp != appData || wasTitle != titleData) {
                output = rulesParser({
                  CONDITIONS: CONDITIONS, 
                  RULES: RULES, 
                  DEFAULT: VALUES['DEFAULT'], 
                  LITERALS: { 
                    app: appData, 
                    title: titleData 
                  }
                });
              }              
            });

            if(output && was != output) {
              device.write( [ output ] );
              was = output;
              wasApp = appData;
              wasTitle = titleData;
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
