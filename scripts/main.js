var left_joystick = null;
var right_joystick = null;

var left_timer = 0;
var right_timer = 0;

var linear_x = 0;
var angular_z = 0;

const JOYSTICK_SIZE = 150;
const MAX_LINEAR_VALUE = 0.75;
const MAX_ROTATE_VALUE = 0.75;

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
            try {
                var res = JSON.parse(event.data);
                updateRangeInput(document.getElementById('leftVelRange'), res.left_motor_speed);
                updateRangeInput(document.getElementById('rightVelRange'), res.right_motor_speed);
            }
            catch (e) {
                console.log(e);
            }
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
    transmitVelocity(linear_x, angular_z);
}

function rightJoystickStart(event, nipple) {
    right_timer = setInterval(function () {
        transmitVelocity(linear_x, angular_z)
    }, 25);
}

function rightJoystickMove(event, nipple) {
    angular_z = -Math.cos(nipple.angle.radian) * MAX_ROTATE_VALUE * nipple.distance / (JOYSTICK_SIZE / 2);
}

function rightJoystickEnd(event, nipple) {
    if (right_timer) clearInterval(right_timer);
    angular_z = 0;
    transmitVelocity(linear_x, angular_z);
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

function updateRangeInput(rangeInput, value) {
    // Get the container element
    var container = rangeInput.parentElement;

    // Calculate the width of the container
    var containerWidth = container.offsetWidth;

    // Calculate the position of the range input based on the value
    var inputPosition = ((value + 1) / 2) * containerWidth;

    // Update the position of the range input
    rangeInput.style.left = inputPosition + 'px';

    // Update the value of the range input
    rangeInput.value = value;
}

$(document).ready(function () {
    // JoySticks
    initJoystick();
});
