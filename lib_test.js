// Require pigpio library
const pigpio = require('pigpio');

// Test pigpio library by blinking an LED connected to GPIO 17
const Gpio = pigpio.Gpio;
const led = new Gpio(17, {mode: Gpio.OUTPUT});

let isLedOn = false;
setInterval(() => {
  isLedOn = !isLedOn;
  led.digitalWrite(isLedOn ? 1 : 0);
}, 500);

// Require ws library
const WebSocket = require('ws');

// Test ws library by creating a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.send('Hello, world!');
});

// Require lite-server library
const liteServer = require('lite-server');

// Test lite-server library by serving a static web page
const config = {
  server: {
    baseDir: './public'
  }
};

liteServer.server(config, () => {
  console.log('===Library Check Pass===');
  process.exit(0);
});

