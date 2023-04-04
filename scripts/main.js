const JOYSTICK_SIZE = 200;

let xValue = 0;
let zValue = 0;

let max_linear_vel = 0.2;
let max_angular_vel = 0.2;

let pausing = false;

const intervalLabel = document.querySelector('.value-label');
const leftButton = document.querySelector('.left-button');
const rightButton = document.querySelector('.right-button');
let interval = 1;

function updateValue() {
    intervalLabel.textContent = `${interval} s`;
}

function decrementValue() {
    if (interval > 1) {
        interval--;
    }
    updateValue();
}

function incrementValue() {
    if (interval < 20) {
        interval++;
    }
    updateValue();
}

const leftJoystickOptions = {
    zone: document.getElementById('js-left'),
    mode: 'static',
    position: { left: '50%', bottom: '50%' },
    size: JOYSTICK_SIZE,
    color: 'blue',
    restJoystick: true,
    restOpacity: 0.5,
    lockY: true
};

const rightJoystickOptions = {
    zone: document.getElementById('js-right'),
    mode: 'static',
    position: { right: '50%', bottom: '50%' },
    size: JOYSTICK_SIZE,
    color: 'red',
    restJoystick: true,
    restOpacity: 0.5,
    lockX: true
};

let leftJoystick = null;
let rightJoystick = null;
let socket = null;

let alertOption = {
    position: "top-right",
    maxNotifications: 2
}

function connectWebSocket() {
    showLoadingMask();

    socket = new WebSocket('ws://192.168.4.1:666');
    // socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
        // Update the indicator and button when connected
        $('#ws-indicator').removeClass('ws-disconnected').addClass('ws-connected');
        $('#online-indicator').removeClass('ws-disconnected').addClass('ws-connected');
        // $('#connect-btn').prop('disabled', true);

        leftJoystick.on('move', (event, data) => {
            xValue = -Math.sin(data.angle.radian) * max_linear_vel * data.distance / (JOYSTICK_SIZE / 2);
            xValue = parseFloat(xValue.toFixed(2));
            sendJoystickData();
        });

        rightJoystick.on('move', (event, data) => {
            //zValue = data.force * Math.sin(data.angle.radian);
            zValue = Math.cos(data.angle.radian) * max_angular_vel * data.distance / (JOYSTICK_SIZE / 2);
            zValue = parseFloat(zValue.toFixed(2));
            sendJoystickData();
        });

        leftJoystick.on('end', () => {
            xValue = 0;
            sendJoystickData();
        });

        rightJoystick.on('end', () => {
            zValue = 0;
            sendJoystickData();
        });

        $('#forward_btn').on('touchstart', () => {
            xValue = -max_linear_vel;
            zValue = 0;
            sendJoystickData();
        });
        $('#forward_btn').on('touchend', () => {
            xValue = 0;
            zValue = 0;
            sendJoystickData();
        });

        $('#backward_btn').on('touchstart', () => {
            xValue = max_linear_vel;
            zValue = 0;
            sendJoystickData();
        });
        $('#backward_btn').on('touchend', () => {
            xValue = 0;
            zValue = 0;
            sendJoystickData();
        });

        $('#left_btn').on('touchstart', () => {
            xValue = 0;
            zValue = -max_angular_vel;
            sendJoystickData();
        });
        $('#left_btn').on('touchend', () => {
            xValue = 0;
            zValue = 0;
            sendJoystickData();
        });

        $('#right_btn').on('touchstart', () => {
            xValue = 0;
            zValue = max_angular_vel;
            sendJoystickData();
        });
        $('#right_btn').on('touchend', () => {
            xValue = 0;
            zValue = 0;
            sendJoystickData();
        });

        $('#stop_btn').on('click', () => {
            xValue = 0;
            zValue = 0;
            sendJoystickData();
        });

        $('#auto-pause-btn').on('touchstart', () => {
            pausing = true;
            xValue = 0;
            zValue = 0;
            sendJoystickData();
        });
        $('#auto-pause-btn').on('touchend', () => {
            pausing = false;
        });

        leftButton.addEventListener('click', decrementValue);
        rightButton.addEventListener('click', incrementValue);

        const toggles = document.querySelectorAll('.switch input');
        toggles.forEach(toggle => {
            toggle.disabled = false;
        });

        resetVelocity();
        hideLoadingMask();

        $(".connect-button").removeClass("onclic");
        $(".connect-button").addClass("validate");
        $('.connect-button').prop('disabled', true);
    };

    socket.onerror = () => {
        // Update the indicator and button on error
        $('#ws-indicator').removeClass('ws-connected').addClass('ws-disconnected');
        $('#online-indicator').removeClass('ws-connected').addClass('ws-disconnected');
        $('#connect-btn').prop('disabled', false);

        resetVelocity();
        hideLoadingMask();

        $(".connect-button").removeClass("onclic");
        $(".connect-button").removeClass("validate");
        $(".connect-button").addClass("connection-error");

        setTimeout(() => {
            $(".connect-button").removeClass("connection-error");
            $('.connect-button').prop('disabled', false);
        }, 1000);
    };

    socket.onclose = () => {
        // Update the indicator and button on close
        $('#ws-indicator').removeClass('ws-connected').addClass('ws-disconnected');
        $('#online-indicator').removeClass('ws-connected').addClass('ws-disconnected');
        $('#connect-btn').prop('disabled', false);

        resetVelocity();
        hideLoadingMask();

        $(".connect-button").removeClass("onclic");
        $(".connect-button").removeClass("validate");
        $(".connect-button").addClass("connection-error");

        setTimeout(() => {
            $(".connect-button").removeClass("connection-error");
            $('.connect-button').prop('disabled', false);
        }, 1000);
        swal("Error!", "Websocket connection closed or not exist!", "error").then((answer) => {
            // Refresh the page.
            location.reload();
        });
    };
}

function formatFloat(num) {
    const floatNum = parseFloat(num);
    if (isNaN(floatNum)) {
        throw new Error('Invalid number format');
    }
    return parseFloat(floatNum.toFixed(2));
}

function sendJoystickData() {
    // if socket exist, send the message
    if (socket) {
        const message = {
            x: formatFloat(xValue),
            z: formatFloat(zValue)
        };
        $("#x-value").text(message.x);
        $("#z-value").text(message.z);
        console.log(message);
        socket.send(JSON.stringify(message));
    }
}

function resetVelocity() {
    $("#x-value").text("0.0");
    $("#z-value").text("0.0");
    xValue = 0;
    zValue = 0;
    sendJoystickData();
}

function showJoysticks() {
    $('.js-panel').css('opacity', 1);
    setTimeout(() => $('.js-panel').css('display', 'block'), 500);
}

function hideJoysticks() {
    $('.js-panel').css('opacity', 0);
    setTimeout(() => $('.joystick').css('display', 'none'), 500);
}

function showArrowPanel() {
    $('.arrow-panel').css('opacity', 1);
    setTimeout(() => $('.arrow-panel').css('display', 'flex'), 500);
}

function hideArrowPanel() {
    $('.arrow-panel').css('opacity', 0);
    setTimeout(() => $('.arrow-panel').css('display', 'none'), 500);
}

function showManualPanel() {
    $('.manual-panel').css('opacity', 1);
    setTimeout(() => $('.manual-panel').show(), 500);
}

function hideManualPanel() {
    $('.manual-panel').css('opacity', 0);
    setTimeout(() => $('.manual-panel').hide(), 500);
}

function showAutoPanel() {
    $('.auto-panel').css('opacity', 1);
    setTimeout(() => $('.auto-panel').show(), 500);
    $('.stop-panel').css('opacity', 1);
    setTimeout(() => $('.stop-panel').show(), 500);
}

function hideAutoPanel() {
    $('.auto-panel').css('opacity', 0);
    setTimeout(() => $('.auto-panel').hide(), 500);
    $('.stop-panel').css('opacity', 0);
    setTimeout(() => $('.stop-panel').hide(), 500);
}

function showLoadingMask() {
    $('.loading-container').removeClass('loading-off').addClass('loading-on');
}

function hideLoadingMask() {
    $('.loading-container').removeClass('loading-on').addClass('loading-off');
}

function createToggle1Interval(interval) {
    let i = 0;
    function toggle1Function() {
        if (pausing) {
            return;
        }
        if (i % 2 == 0) {
            xValue = -max_linear_vel;
        } else {
            xValue = max_linear_vel;
        }
        zValue = 0;
        sendJoystickData();
        i++;
    }
    toggle1Function();
    return setInterval(toggle1Function, interval);
}

function createToggle2Interval(interval) {
    function toggle2Function() {
        if (pausing) {
            return;
        }
        xValue = -max_linear_vel / 1.2;
        zValue = max_angular_vel;
        sendJoystickData();
    }
    toggle2Function();
    return setInterval(toggle2Function, interval);
}

function createToggle3Interval(interval) {
    function toggle3Function() {
        if (pausing) {
            return;
        }
        xValue = -max_linear_vel / 1.2;
        zValue = -max_angular_vel;
        sendJoystickData();
    }
    toggle3Function();
    return setInterval(toggle3Function, interval);
}

$(document).ready(function () {
    var slider = $('#velocity-slider');
    var currentValue = $('.current-value');
    var sliderLabel = $('.slider-label');

    // Initialize the label and value
    currentValue.text(slider.val());
    sliderLabel.text(slider.val());

    // Update the label and value as the slider is dragged
    slider.on('input change', function () {
        var value = $(this).val();
        max_linear_vel = value;
        max_angular_vel = value;

        currentValue.text(value);
        sliderLabel.text(value);
    });


    leftJoystick = nipplejs.create(leftJoystickOptions);
    rightJoystick = nipplejs.create(rightJoystickOptions);


    // Tab switching


    $('#joysticks-tab').on('click', function (e) {
        e.preventDefault();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
        showJoysticks();
        hideArrowPanel();
        showManualPanel();
        hideAutoPanel();
        const toggles = document.querySelectorAll('.switch input');
        toggles.forEach(toggle => {
            toggle.checked = false;
            clearInterval(toggle.intervalId);
            toggle.intervalId = null;
        });
        resetVelocity();
    });

    $('#arrow-tab').on('click', function (e) {
        e.preventDefault();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
        showArrowPanel();
        hideJoysticks();
        showManualPanel();
        hideAutoPanel();
        const toggles = document.querySelectorAll('.switch input');
        toggles.forEach(toggle => {
            toggle.checked = false;
            clearInterval(toggle.intervalId);
            toggle.intervalId = null;
        });
        resetVelocity();
    });

    $('#auto-tab').on('click', function (e) {
        e.preventDefault();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
        hideJoysticks();
        hideArrowPanel();
        hideManualPanel();
        showAutoPanel();
        const toggles = document.querySelectorAll('.switch input');
        toggles.forEach(toggle => {
            toggle.checked = false;
            clearInterval(toggle.intervalId);
            toggle.intervalId = null;
        });
        resetVelocity();
    });

    const toggles = document.querySelectorAll('.switch input');
    toggles.forEach(toggle => {
        toggle.disabled = true;
        toggle.addEventListener('change', (event) => {
            if (event.target.checked) {
                toggles.forEach(otherToggle => {
                    if (otherToggle !== toggle) {
                        otherToggle.checked = false;
                        clearInterval(otherToggle.intervalId);
                    }
                });
                if (toggle.id === 'toggle1') {
                    toggle.intervalId = createToggle1Interval(interval * 1000);
                } else if (toggle.id === 'toggle2') {
                    toggle.intervalId = createToggle2Interval(interval * 1000);
                } else if (toggle.id === 'toggle3') {
                    toggle.intervalId = createToggle3Interval(interval * 1000);
                }
            } else {
                clearInterval(toggle.intervalId);
                resetVelocity();
            }
        });
    });

    $(".connect-button").click(function () {
        $(".connect-button").addClass("onclic", 250);
        setTimeout(connectWebSocket, 500);
    });

    updateValue();

    // Initialize with the joysticks tab active
    showJoysticks();
});
