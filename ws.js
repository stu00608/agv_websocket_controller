const WebSocket = require('ws');
const { digitalWrite, analogWrite } = require('./gpio.js');

const server = new WebSocket.Server({ port: 666, host: '0.0.0.0' });

const WIDTH = 1.0; // Replace with your own value
const WHEEL_RADIUS = 1.0; // Replace with your own value

const LEFTDIRECTIONPIN = 17;
const LEFTSPEEDPIN = 27;
const LEFTBREAKPIN = 22;
const RIGHTDIRECTIONPIN = 23;
const RIGHTSPEEDPIN = 24;
const RIGHTBREAKPIN = 25;

server.on('connection', function connection(socket) {
    console.log('A client connected');

    socket.on('message', function incoming(message) {
        message = message.toString();
        message = JSON.parse(message);
        // console.log(message);
        let vel = calc_velocity(message.x, message.z);
        if (message.control_mode != 2) {
            motor_control(vel);
        }
    });

    socket.on('close', function close() {
        console.log('A client disconnected');
    });
});

function calc_velocity(x, z) {

    let omega_left = ((x - (z * WIDTH) / 2.0) / WHEEL_RADIUS);
    omega_left = Math.min(
        1.0,
        Math.max(-1.0, (omega_left - (-1.0)) * (1.0 - (-1.0)) / (1.0 - (-1.0)) +
            (-1.0))
    );
    omega_left *= 255.0;
    omega_left = Math.floor(omega_left);

    let omega_right = ((x + (z * WIDTH) / 2.0) / WHEEL_RADIUS);
    omega_right = Math.min(
        1.0,
        Math.max(-1.0, (omega_right - (-1.0)) * (1.0 - (-1.0)) / (1.0 - (-1.0)) +
            (-1.0))
    );
    omega_right *= 255.0;
    omega_right = Math.floor(omega_right);

    return { omega_left, omega_right };
}

function motor_control(velocity) {

    let left_directionPin, right_directionPin, left_break, right_break;
    let left_sign = Math.sign(velocity.omega_left);
    let right_sign = Math.sign(velocity.omega_right);
    let left_value = Math.abs(velocity.omega_left);
    let right_value = Math.abs(velocity.omega_right);

    if (left_sign == 1) {
        left_directionPin = 1;
        left_break = 1;
    } else if (left_sign == -1) {
        left_directionPin = 0;
        left_break = 1;
    } else {
        left_directionPin = 0;
        left_break = 0;
    }

    if (right_sign == 1) {
        right_directionPin = 1;
        right_break = 1;
    } else if (right_sign == -1) {
        right_directionPin = 0;
        right_break = 1;
    } else {
        right_directionPin = 0;
        right_break = 0;
    }

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

    digitalWrite(LEFTDIRECTIONPIN, left_directionPin);
    analogWrite(LEFTSPEEDPIN, left_value);
    digitalWrite(LEFTBREAKPIN, left_break);

    digitalWrite(RIGHTDIRECTIONPIN, right_directionPin);
    analogWrite(RIGHTSPEEDPIN, right_value);
    digitalWrite(RIGHTBREAKPIN, right_break);

}
