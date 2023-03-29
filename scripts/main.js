const socket = new WebSocket('ws://192.168.4.1:666');

let xValue = 0;
let zValue = 0;

socket.onopen = () => {
    console.log('WebSocket connected');

    leftJoystick.on('move', (event, data) => {
        xValue = data.force * Math.cos(data.angle.radian);
        sendJoystickData();
    });

    rightJoystick.on('move', (event, data) => {
        zValue = data.force * Math.sin(data.angle.radian);
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
};

function sendJoystickData() {
    const message = {
        x: parseFloat(xValue.toFixed(2)),
        z: parseFloat(zValue.toFixed(2))
    };
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
        currentValue.text(value);
        sliderLabel.text(value);
    });

    const leftJoystickOptions = {
        zone: document.getElementById('js-left'),
        mode: 'static',
        position: { left: '50%', bottom: '50%' },
        size: 200,
        color: 'blue',
        restJoystick: true,
        restOpacity: 0.5,
        lockY: true
    };

    const rightJoystickOptions = {
        zone: document.getElementById('js-right'),
        mode: 'static',
        position: { right: '50%', bottom: '50%' },
        size: 200,
        color: 'red',
        restJoystick: true,
        restOpacity: 0.5,
        lockX: true
    };

    const leftJoystick = nipplejs.create(leftJoystickOptions);
    const rightJoystick = nipplejs.create(rightJoystickOptions);


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

    // Initialize with the joysticks tab active
    showJoysticks();
});
