const WebSocket = require('ws');
const { digitalWrite, analogWrite } = require('./gpio.js');

const server = new WebSocket.Server({ port: 666, host: '0.0.0.0' });
let connected = false;

const DEBUG = false;

const WIDTH = 0.65; // width of the vehicle
const WHEEL_RADIUS = 0.055; // radius of the wheels

const LEFTDIRECTIONPIN = 17;
const LEFTSPEEDPIN = 27;
const LEFTBREAKPIN = 22;
const RIGHTDIRECTIONPIN = 23;
const RIGHTSPEEDPIN = 10;
const RIGHTBREAKPIN = 25;

const MAX_VEL_VALUE = ((1.0 + (1.0 * WIDTH) / 2.0) / WHEEL_RADIUS);
console.log(MAX_VEL_VALUE);

server.on('connection', function connection(socket) {
    if (connected) {
        ws.send('Sorry, only one client is allowed at a time.');
        ws.close();
        return;
    }
    console.log('A client connected');
    connected = true;

    socket.on('message', function incoming(message) {
        message = message.toString();
        message = JSON.parse(message);
        console.log(message.x, message.z);
        let vel = calc_velocity(message.x, message.z);
        if (message.control_mode != 2) {
            motor_control(vel);
        }
    });

    socket.on('close', function close() {
        console.log('A client disconnected');
    });
});

function map_value(value, fromLow, fromHigh, toLow, toHigh) {
    return toLow + (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow);
}

function calc_velocity(x, z) {

    // Scale up the rotation speed if only rotating.
    if (x == 0) {
        z = clamp(z * 2.0, -1.0, 1.0);
        console.log(`z=${z}`);
    }

    let omega_left = ((x - (z * WIDTH) / 2.0) / WHEEL_RADIUS);
    omega_left = Math.sign(omega_left) * map_value(Math.abs(omega_left), 0, MAX_VEL_VALUE, 0, 255.0);
    omega_left = Math.floor(omega_left);

    let omega_right = ((x + (z * WIDTH) / 2.0) / WHEEL_RADIUS);
    omega_right = Math.sign(omega_right) * map_value(Math.abs(omega_right), 0, MAX_VEL_VALUE, 0, 255.0);
    omega_right = Math.floor(omega_right);

    return { omega_left, omega_right };
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function motor_control(velocity) {
    let left_directionPin = +(velocity.omega_left < 0);
    let left_value = Math.abs(velocity.omega_left);
    let left_break = +(velocity.omega_left != 0);

    let right_directionPin = +(velocity.omega_right < 0);
    let right_value = Math.abs(velocity.omega_right);
    let right_break = +(velocity.omega_right != 0);

    console.log(
        left_directionPin,
        ",",
        left_value,
        ",",
        left_break,
        "||",
        right_directionPin,
        ",",
        right_value,
        ",",
        right_break
    );

    if (!DEBUG) {
        digitalWrite(LEFTDIRECTIONPIN, left_directionPin);
        analogWrite(LEFTSPEEDPIN, left_value);
        digitalWrite(LEFTBREAKPIN, left_break);

        digitalWrite(RIGHTDIRECTIONPIN, right_directionPin);
        analogWrite(RIGHTSPEEDPIN, right_value);
        digitalWrite(RIGHTBREAKPIN, right_break);
    }

}
