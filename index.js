"use strict";

const { spawn } = require('child_process');
var hid = require('node-hid');
var timerID;

var isTargetDevice = function(d) {
  return d.product==='z12' && d.usagePage===0xFF60 && d.usage===0x61;
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

      var toSend;
      var app;
      var appData;
      var title;
      var titleData;

      setTimeout( () => {
          timerID = setInterval( () => {
            const tt = spawn('active-win', ['title']);
            tt.stdout.on('data', (data) => {
              // reset
              title = '';

              titleData = data.toString().trim().toLowerCase();
              if(titleData.indexOf('vim') > -1) {
                title = '_NVIM';
              } else if(titleData.indexOf('figma') > -1) {
                title = '_FIGM';
              }
            });
            const aw = spawn('active-win', ['app']);
            aw.stdout.on('data', (data) => {
              // reset
              app = '';

              appData = data.toString().trim().toLowerCase();
              if(appData.indexOf('firefox') > -1 || appData.indexOf('chrome') > -1 || appData.indexOf('safari') > -1) {
                app = '_BROW';
              } else {
                app = '_TERM';
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

              if(ts != undefined) {
                device.write( [ ts ] );
              }
            }
            
          }, 500);
      }, 2000);
    } else {}
  } else {
    setTimeout( () => {
      connect();
    }, 2000);
  }
}

connect();
