const JOYSTICK_SIZE = 200;

let xValue = 0;
let zValue = 0;

let max_linear_vel = 0.2;
let max_angular_vel = 0.2;

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
let notifier = new AWN(alertOption)

function connectWebSocket() {
    // socket = new WebSocket('ws://192.168.4.1:666');
    socket = new WebSocket('ws://localhost:8080');


    socket.onopen = () => {
        // Update the indicator and button when connected
        $('#ws-indicator').removeClass('ws-disconnected').addClass('ws-connected');
        $('#online-indicator').removeClass('ws-disconnected').addClass('ws-connected');
        $('#connect-btn').prop('disabled', true);

        leftJoystick.on('move', (event, data) => {
            //xValue = data.force * Math.cos(data.angle.radian);
            xValue = -Math.sin(data.angle.radian) * max_linear_vel * data.distance / (JOYSTICK_SIZE / 2);
            sendJoystickData();
        });

        rightJoystick.on('move', (event, data) => {
            //zValue = data.force * Math.sin(data.angle.radian);
            zValue = Math.cos(data.angle.radian) * max_angular_vel * data.distance / (JOYSTICK_SIZE / 2);
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

        $("#x-value").text("0.0");
        $("#z-value").text("0.0");

        notifier.success("Successfully connected to websocket server.");

    };

    socket.onerror = () => {
        // Update the indicator and button on error
        $('#ws-indicator').removeClass('ws-connected').addClass('ws-disconnected');
        $('#online-indicator').removeClass('ws-connected').addClass('ws-disconnected');
        $('#connect-btn').prop('disabled', false);

        notifier.error("Websocket connection error!");
    };

    socket.onclose = () => {
        // Update the indicator and button on close
        $('#ws-indicator').removeClass('ws-connected').addClass('ws-disconnected');
        $('#online-indicator').removeClass('ws-connected').addClass('ws-disconnected');
        $('#connect-btn').prop('disabled', false);

        swal("Error!", "Websocket connection closed or not exist!", "error");
    };
}

function sendJoystickData() {
    const message = {
        x: parseFloat(xValue.toFixed(2)),
        z: parseFloat(zValue.toFixed(2))
    };
    $("#x-value").text(message.x);
    $("#z-value").text(message.z);
    socket.send(JSON.stringify(message));
}

function showJoysticks() {
    $('.js-panel').css('opacity', 1);
    setTimeout(() => $('.js-panel').css('display', 'block'), 500);
    $('.arrow-panel').css('opacity', 0);
    setTimeout(() => $('.arrow-panel').css('display', 'none'), 500);
}

function showArrowPanel() {
    $('.js-panel').css('opacity', 0);
    setTimeout(() => $('.joystick').css('display', 'none'), 500);
    $('.arrow-panel').css('opacity', 1);
    setTimeout(() => $('.arrow-panel').css('display', 'flex'), 500);
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
    });

    $('#arrow-tab').on('click', function (e) {
        e.preventDefault();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
        showArrowPanel();
    });

    $('#connect-btn').on('click', () => {
        connectWebSocket();
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


    // Initialize with the joysticks tab active
    showJoysticks();
});
