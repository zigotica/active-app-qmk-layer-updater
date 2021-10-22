/* eslint prefer-destructuring: ["error", {VariableDeclarator: {array: true}}] */
const { spawn } = require('child_process');
const hid = require('node-hid');
const fs = require('fs');
const { parser } = require('json-based-conditions-and-rules-logic-evaluator');

const ARGS = process.argv.slice(2);
const path = ARGS[0] || './config.json';
let timerID;
let device;

if (!fs.existsSync(path)) {
  console.log('configuration file needed');
  process.exit();
}

const configfile = fs.readFileSync(path);
const config = JSON.parse(configfile);

const {
  PRODUCT,
  TIMERS,
  DEFAULT,
  CONDITIONS,
  RULES,
} = config;

const isTargetDevice = function (d) {
  return d.product === PRODUCT && d.usagePage === 0xFF60 && d.usage === 0x61;
};

function connect() {
  const devices = hid.devices();
  const deviceInfo = devices.find((d) => isTargetDevice(d));
  let was = DEFAULT;
  let wasApp = '';
  let wasTitle = '';
  let output;
  let appData;
  let titleData;

  if (deviceInfo) {
    device = new hid.HID(deviceInfo.path);

    if (device) {
      device.on('data', () => {});

      device.on('error', (err) => {
        console.log('device error:', err);
        device.close();
        clearInterval(timerID);
        connect();
      });

      device.write([DEFAULT]); // default layer code

      setTimeout(() => {
        timerID = setInterval(() => {
          const aw = spawn('npm exec active-win');
          aw.stdout.on('data', (data) => {
            const arr = data.toString().trim().toLowerCase().split('\n');

            appData = arr[2];
            titleData = arr[0];

            if (wasApp !== appData || wasTitle !== titleData) {
              output = parser({
                CONDITIONS,
                RULES,
                DEFAULT,
              }, {
                app: appData,
                title: titleData,
              });
            }
          });

          if (output && was !== output) {
            device.write([output]);
            was = output;
            wasApp = appData;
            wasTitle = titleData;
          }
        }, TIMERS.RUNNER);
      }, TIMERS.LINK);
    }
  } else {
    setTimeout(() => {
      connect();
    }, TIMERS.RELINK);
  }
}

connect();
