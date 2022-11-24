var left_joystick = null;
var right_joystick = null;

var left_timer = 0;
var right_timer = 0;

var linear_x = 0;
var angular_z = 0;

const JOYSTICK_SIZE = 150;
const MAX_LINEAR_VALUE = 1.0;
const MAX_ROTATE_VALUE = 1.0;

var socket = null;
var config = null;
fetch('./assets/config/config.json')
    .then(response => response.json())
    .then(data => {
        config = data;
        socket = new WebSocket(config.websocketServerIP);
        socket.onopen = function (e) {
            console.log("[open] Connection established");
        };
        socket.onmessage = function (event) {
            console.log(`[message] Data received from server: ${event.data}`);
        };
        socket.onclose = function (event) {
            if (event.wasClean) {
                console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                console.log('[close] Connection died');
            }
        };
        socket.onerror = function (error) {
            alert(`[error]`);
        };
    })
    .catch(err => console.error(err));

function transmitVelocity(x, z) {
    const data = JSON.stringify({ x: x, z: z });
    socket.send(data);
}

function leftJoystickStart(event, nipple) {
    left_timer = setInterval(function () {
        transmitVelocity(linear_x, angular_z)
    }, 25);
}

function leftJoystickMove(event, nipple) {
    linear_x = Math.sin(nipple.angle.radian) * MAX_LINEAR_VALUE * nipple.distance / (JOYSTICK_SIZE / 2);
}

function leftJoystickEnd(event, nipple) {
    if (left_timer) clearInterval(left_timer);
    linear_x = 0;
}

function rightJoystickStart(event, nipple) {
    right_timer = setInterval(function () {
        transmitVelocity(linear_x, angular_z)
    }, 25);
}

function rightJoystickMove(event, nipple) {
    angular_z = Math.cos(nipple.angle.radian) * MAX_ROTATE_VALUE * nipple.distance / (JOYSTICK_SIZE / 2);
}

function rightJoystickEnd(event, nipple) {
    if (right_timer) clearInterval(right_timer);
    angular_z = 0;
}

function initJoystick() {

    var left_options = {
        zone: $("#js-left")[0],
        mode: "static",
        position: { left: "50%", top: "50%" },
        color: 'red',
        lockY: true,
        size: JOYSTICK_SIZE,
    };
    left_joystick = nipplejs.create(left_options);
    left_joystick.on("start", leftJoystickStart);
    left_joystick.on("move", leftJoystickMove);
    left_joystick.on("end", leftJoystickEnd);

    var right_options = {
        zone: $("#js-right")[0],
        mode: "static",
        position: { left: "50%", top: "50%" },
        color: 'blue',
        lockX: true,
        size: JOYSTICK_SIZE,
    };
    right_joystick = nipplejs.create(right_options);
    right_joystick.on("start", rightJoystickStart);
    right_joystick.on("move", rightJoystickMove);
    right_joystick.on("end", rightJoystickEnd);
}

$(document).ready(function () {
    // JoySticks
    initJoystick();
});
