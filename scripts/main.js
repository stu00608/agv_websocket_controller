var left_joystick = null;
var right_joystick = null;

var left_timer = 0;
var right_timer = 0;

var linear_x = 0;
var angular_z = 0;

const JOYSTICK_SIZE = 150;
var max_linear_value = 0.75;
var max_rotate_value = 0.75;

// mode 1: Manual control mode. 
// mode 2: Auto control mode.
var control_mode = 1;

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
                console.log(res);
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

function wrapData(x, z, mode_2_round) {
    return JSON.stringify({
        mode: control_mode,
        x: x,
        z: z,
        mode_2_round: mode_2_round
    });
}

function transmitVelocity(x, z) {
    if (control_mode != 1) {
        console.log("Wrong mode.")
        return;
    }
    socket.send(wrapData(x, z, 0));
}

function leftJoystickStart(event, nipple) {
    left_timer = setInterval(function () {
        transmitVelocity(linear_x, angular_z)
    }, 25);
}

function leftJoystickMove(event, nipple) {
    linear_x = Math.sin(nipple.angle.radian) * max_linear_value * nipple.distance / (JOYSTICK_SIZE / 2);
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
    angular_z = -Math.cos(nipple.angle.radian) * max_rotate_value * nipple.distance / (JOYSTICK_SIZE / 2);
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

function updateMaxVelocityRangeValue() {
    document.getElementById('maxVelocityRangeValue').innerHTML = document.getElementById('maxVelocityRange').value;
    max_linear_value = document.getElementById('maxVelocityRange').value;
    max_rotate_value = document.getElementById('maxVelocityRange').value;
}

function modeBtn1Callback() {
    if (control_mode == 1) {
        console.log("Already in manual mode.")
        return;
    }
    control_mode = 1;
    initJoystick();
}

function modeBtn2Callback() {
    // show the modal with id audoModeModal
    $('#autoModeModal').modal('show');
    if (control_mode == 2) {
        console.log("Already in auto mode.")
        return;
    }
    control_mode = 2;
    left_joystick.destroy();
    right_joystick.destroy();
}

function sendAutoModeData() {
    if (control_mode != 2) {
        console.log("Wrong mode.")
        return;
    }
    var round = document.getElementById('numberSelect').value;
    socket.send(wrapData(0, 0, round));
    $('#autoModeModal').modal('hide');
}

$(document).ready(function () {
    // JoySticks
    initJoystick();

    // Range Event
    updateMaxVelocityRangeValue();
    document.getElementById('maxVelocityRange').addEventListener('input', updateMaxVelocityRangeValue);

    // Button Event
    document.getElementById('modeBtn1').addEventListener('click', modeBtn1Callback);
    document.getElementById('modeBtn2').addEventListener('click', modeBtn2Callback);
    $("#autoModeSubmitBtn").click(sendAutoModeData);

    // Control Mode
    control_mode = 1;
});
