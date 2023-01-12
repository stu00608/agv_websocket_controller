var left_joystick = null;
var right_joystick = null;

var left_timer = 0;
var right_timer = 0;

var linear_x = 0;
var angular_z = 0;

const JOYSTICK_SIZE = 150;
var max_linear_value = 0.75;
var max_rotate_value = 0.75;

var left_transmit_flag = false;
var right_transmit_flag = false;

// mode 1: Manual control mode. 
// mode 2: Auto control mode.
var control_mode = 1;

var arrow_control_timer = 0;

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

function wrapData(x, z, auto_mode, auto_mode_1_round) {
    return JSON.stringify({
        control_mode: control_mode,
        auto_mode: auto_mode,
        x: x,
        z: z,
        auto_mode_1_round: auto_mode_1_round
    });
    // return `${control_mode},${auto_mode},${x},${z},${auto_mode_1_round}`
}

function transmitVelocity(x, z) {
    if (control_mode == 2) {
        console.log("Wrong mode.")
        return;
    }
    var data = wrapData(roundOf(x, 3), roundOf(z, 3), 0, 0);
    console.log(data);
    socket.send(data);
}

function transmitLoop() {
    console.log("looping")
    if (left_transmit_flag || right_transmit_flag) {
        transmitVelocity(linear_x, angular_z);
    }
}

function leftJoystickStart(event, nipple) {
    // left_timer = setInterval(function () {
    //     transmitVelocity(linear_x, angular_z)
    // }, 200);
    left_transmit_flag = true;
}

function leftJoystickMove(event, nipple) {
    linear_x = Math.sin(nipple.angle.radian) * max_linear_value * nipple.distance / (JOYSTICK_SIZE / 2);
}

function leftJoystickEnd(event, nipple) {
    // if (left_timer) clearInterval(left_timer);
    linear_x = 0;
    left_transmit_flag = false;

    // transmitVelocity(0, angular_z);
    setTimeout(function () {
        // left_transmit_flag = false;
        transmitVelocity(0, angular_z);
    }, 250);
}

function rightJoystickStart(event, nipple) {
    // right_timer = setInterval(function () {
    //     transmitVelocity(linear_x, angular_z)
    // }, 200);
    right_transmit_flag = true;
}

function rightJoystickMove(event, nipple) {
    angular_z = -Math.cos(nipple.angle.radian) * max_rotate_value * nipple.distance / (JOYSTICK_SIZE / 2);
}

function rightJoystickEnd(event, nipple) {
    // if (right_timer) clearInterval(right_timer);
    angular_z = 0;
    right_transmit_flag = false;

    // transmitVelocity(linear_x, 0);
    setTimeout(function () {
        transmitVelocity(linear_x, 0);
        // right_transmit_flag = false;
    }, 250);
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
    max_rotate_value = clamp(document.getElementById('maxVelocityRange').value * 1.25, 0.0, 1.0);
}

function modeBtn1Callback() {
    if (control_mode == 1) {
        console.log("Already in manual mode.")
        return;
    }
    control_mode = 1;
    initJoystick();

    $("#arrow-panel").css("display", "none");
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

    $("#arrow-panel").css("display", "none");
}

function modeBtn3Callback() {
    if (control_mode == 3) {
        console.log("Already in button control mode.")
        return;
    }
    control_mode = 3;
    left_joystick.destroy();
    right_joystick.destroy();

    $("#arrow-panel").css("display", "block");
    $("#arrow-panel").css("z-index", "999");
}

function sendAutoModeData() {
    if (control_mode != 2) {
        console.log("Wrong mode.")
        return;
    }

    if ($("#modeSelect").val() == '') {
        console.log("Please select a mode.");
        return;
    }
    else if ($("#modeSelect").val() == '1') {
        var round = document.getElementById('mode1Select').value;
        socket.send(wrapData(0, 0, 1, round));
    }
    else if ($("#modeSelect").val() == '2') {
        socket.send(wrapData(0, 0, 2, 0));
    }
    else if ($("#modeSelect").val() == '3') {
        socket.send(wrapData(0, 0, 3, 0));
    }
    $('#autoModeModal').modal('hide');
}

function updateModalInfo() {
    var mode = $(this).val();
    console.log(mode, typeof (mode));
    if (mode == '') {
        $("#mode1SelectZone").attr("style", "display: none;");
        console.log("default selection");
    }
    else if (mode == '1') {
        console.log("mode 1");
        $("#mode1SelectZone").attr("style", "display: block;");
    }
    else if (mode == '2') {
        console.log("mode 2");
        $("#mode1SelectZone").attr("style", "display: none;");
    }
    else if (mode == '3') {
        console.log("mode 3");
        $("#mode1SelectZone").attr("style", "display: none;");
    }
}

function upBtnCallback() {
    if (control_mode != 3) {
        console.log("Wrong mode.")
        return;
    }
    if (arrow_control_timer) clearInterval(arrow_control_timer);
    arrow_control_timer = setInterval(function () {
        transmitVelocity(max_linear_value, 0);
    }, 250);
}

function leftBtnCallback() {
    if (control_mode != 3) {
        console.log("Wrong mode.")
        return;
    }
    if (arrow_control_timer) clearInterval(arrow_control_timer);
    arrow_control_timer = setInterval(function () {
        transmitVelocity(0, -max_rotate_value)
    }, 250);
}

function rightBtnCallback() {
    if (control_mode != 3) {
        console.log("Wrong mode.")
        return;
    }
    if (arrow_control_timer) clearInterval(arrow_control_timer);
    arrow_control_timer = setInterval(function () {
        transmitVelocity(0, max_rotate_value)
    }, 250);
}

function downBtnCallback() {
    if (control_mode != 3) {
        console.log("Wrong mode.")
        return;
    }
    if (arrow_control_timer) clearInterval(arrow_control_timer);
    arrow_control_timer = setInterval(function () {
        transmitVelocity(-max_linear_value, 0)
    }, 250);
}

function btnReleaseCallback() {
    if (control_mode != 3) {
        console.log("Wrong mode.")
        return;
    }
    if (arrow_control_timer) clearInterval(arrow_control_timer);
    setTimeout(function () {
        transmitVelocity(0, 0);
    }, 250);
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
    document.getElementById('modeBtn3').addEventListener('click', modeBtn3Callback);
    $("#autoModeSubmitBtn").click(sendAutoModeData);

    $('#modeSelect').change(updateModalInfo);

    // Control panel button event
    document.getElementById('upBtn').addEventListener('touchstart', upBtnCallback);
    document.getElementById('leftBtn').addEventListener('touchstart', leftBtnCallback);
    document.getElementById('rightBtn').addEventListener('touchstart', rightBtnCallback);
    document.getElementById('downBtn').addEventListener('touchstart', downBtnCallback);

    document.getElementById('upBtn').addEventListener('touchend', btnReleaseCallback);
    document.getElementById('leftBtn').addEventListener('touchend', btnReleaseCallback);
    document.getElementById('rightBtn').addEventListener('touchend', btnReleaseCallback);
    document.getElementById('downBtn').addEventListener('touchend', btnReleaseCallback);

    // Control Mode
    control_mode = 1;

    setInterval(transmitLoop, 250);
});
