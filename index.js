"use strict";

const { spawn } = require('child_process');
var hid = require('node-hid');
var timerID;
const fs = require('fs');
const ARGS = process.argv.slice(2);
const path = ARGS[0] || 'config.json';

if (!fs.existsSync(path)) {
  console.log('configuration file needed');
  process.exit();
}

let configFile = fs.readFileSync(path);
let configData = JSON.parse(configFile);
const { PRODUCT, TIMERS } = configData;

var isTargetDevice = function(d) {
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

      device.write( [ 0x00 ] ); // default layer

      var was = 0;
      var toSend;
      var app;
      var appData;
      var title;
      var titleData;

      setTimeout( () => {
          timerID = setInterval( () => {
            const aw = spawn('active-win');
            aw.stdout.on('data', (data) => {
              // reset
              app = '';
              title = '';
              const arr = data.toString().trim().toLowerCase().split('\n');

              appData = arr[2];
              titleData = arr[0];

              if(appData.indexOf('firefox') > -1 || appData.indexOf('chrome') > -1 || appData.indexOf('safari') > -1) {
                app = '_BROW';
              } else {
                app = '_TERM';
              }

              if(titleData.indexOf('vim') > -1) {
                title = '_NVIM';
              } else if(titleData.substr(-5) === 'figma') {
                title = '_FIGM';
              }
            });

            // Final logic
            if((app == '_BROW' && title == '_FIGM') || (app == '_TERM' && title == '_NVIM')){
              toSend = title;
            } else toSend = app;

            if(toSend != undefined) {
              var ts;
              if (toSend == '_NVIM') ts = 0x03;
              if (toSend == '_BROW') ts = 0x02;
              if (toSend == '_FIGM') ts = 0x01;
              // default B, we cannot layer_on(data[0]) when 0x00 in raw_hid_receive (why?)
              if (toSend == '_TERM') ts = 0x42;

              if(ts != undefined && was != ts) {
                device.write( [ ts ] );
                was = ts
              }
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
