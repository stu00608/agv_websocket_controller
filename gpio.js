const Gpio = require('pigpio').Gpio;

// Dictionary for storing registered GPIO objects
const gpioDict = {};

// Function for writing digital value to a pin
function digitalWrite(pin, state) {
  if (!(pin in gpioDict)) {
    gpioDict[pin] = new Gpio(pin, {mode: Gpio.OUTPUT});
    // gpioDict[pin].pullUpDown(Gpio.PUD_UP);
  }

  gpioDict[pin].digitalWrite(state);
}

// Function for writing analog value to a pin
function analogWrite(pin, value) {
  if (!(pin in gpioDict)) {
    gpioDict[pin] = new Gpio(pin, {mode: Gpio.OUTPUT});
    gpioDict[pin].pwmFrequency(400);
  }
  // console.log(gpioDict[pin].getPwmFrequency());
  gpioDict[pin].pwmWrite(value);
}

module.exports = {
  digitalWrite,
  analogWrite
};

