#include <ArduinoJson.h>
// #include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <analogWrite.h>

// 機器人參數
#define WIDTH 1.0
#define WHEEL_RADIUS 1.0

// TODO: 控制腳位
#define LEFTDIRECTIONPIN 21
#define LEFTSPEEDPIN 22
#define LEFTBREAKPIN 23
#define RIGHTDIRECTIONPIN 17
#define RIGHTSPEEDPIN 16
#define RIGHTBREAKPIN 4

// 設定AP參數
const char* ssid = "MovableBag";
const char* password = "kaipodoctor";
const int webSocketPort = 81;

// 結構
struct Omegas {
    float omega_left;
    float omega_right;
};

// 全域變數
int control_mode, auto_mode, auto_mode_1_round;

// 建立Websocket伺服器
WebSocketsServer webSocket = WebSocketsServer(webSocketPort);

void setup() {
    // TODO: 初始化控制腳位
    pinMode(LEFTDIRECTIONPIN, OUTPUT);
    pinMode(LEFTSPEEDPIN, OUTPUT);
    pinMode(LEFTBREAKPIN, OUTPUT);
    pinMode(RIGHTDIRECTIONPIN, OUTPUT);
    pinMode(RIGHTSPEEDPIN, OUTPUT);
    pinMode(RIGHTBREAKPIN, OUTPUT);

    // 連接到AP
    WiFi.mode(WIFI_AP);
    WiFi.softAPConfig(IPAddress(192, 168, 1, 1), IPAddress(192, 168, 1, 1),
                      IPAddress(255, 255, 255, 0));
    WiFi.softAP(ssid, password);

    // 列印AP IP地址
    Serial.begin(115200);
    Serial.print("AP IP address: ");
    Serial.println(WiFi.softAPIP());

    // 初始化Websocket伺服器
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
}

void loop() {
    // 監聽連接
    webSocket.loop();
}

void webSocketEvent(uint8_t num, WStype_t type, const uint8_t* payload,
                    size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            // 斷開連接
            break;
        case WStype_CONNECTED:
            // 新客戶端連接
            break;
        case WStype_TEXT:
            // 收到文本消息

            // 將 payload 反序列化為 JSON 物件
            DynamicJsonDocument msg(1024);
            deserializeJson(msg, payload, length);

            // 計算輪子轉速
            Omegas vel =
                calc_velocity(msg["x"].as<float>(), msg["z"].as<float>());
            // 設定輪子轉速
            if (msg["control_mode"].as<int>() != 2) {
                motorControl(vel);
            }

            break;
    }
}

/**
   Returns the sign of a value as an integer.

   @tparam T The type of the value.
   @param val The value whose sign should be returned.
   @return 1 if the value is greater than zero, -1 if the value is less than
   zero, and 0 if the value is equal to zero.
*/
template <typename T>
int sign(T val) {
    return (T(0) < val) - (val < T(0));
}

Omegas calc_velocity(float x, float z) {
    Omegas res;

    res.omega_left = ((x - (z * WIDTH) / 2.0) / WHEEL_RADIUS);
    res.omega_left = fmin(
        1.0,
        fmax(-1.0, (res.omega_left - (-1.0)) * (1.0 - (-1.0)) / (1.0 - (-1.0)) +
                       (-1.0)));
    res.omega_left *= 255.0;
    res.omega_right = ((x + (z * WIDTH) / 2.0) / WHEEL_RADIUS);
    res.omega_right =
        fmin(1.0, fmax(-1.0, (res.omega_right - (-1.0)) * (1.0 - (-1.0)) /
                                     (1.0 - (-1.0)) +
                                 (-1.0)));
    res.omega_right *= 255.0;

    return res;
}

void motorControl(Omegas velocity) {
    // TODO: Rewrite this function to match NodeMCU.
    int right_directionPin, left_directionPin, left_break, right_break;

    int left_sign = sign(velocity.omega_left);
    int right_sign = sign(velocity.omega_right);
    float left_value = abs(velocity.omega_left);
    float right_value = abs(velocity.omega_right);

    if (left_sign == -1) {
        left_directionPin = 1;
        left_break = 1;
    } else if (left_sign == 1) {
        left_directionPin = 0;
        left_break = 1;
    } else {
        left_break = 0;
    }

    if (right_sign == -1) {
        right_directionPin = 1;
        right_break = 1;
    } else if (right_sign == 1) {
        right_directionPin = 0;
        right_break = 1;
    } else {
        right_break = 0;
    }

    digitalWrite(LEFTDIRECTIONPIN, left_directionPin);
    analogWrite(LEFTSPEEDPIN, left_value);
    digitalWrite(LEFTBREAKPIN, left_break);

    digitalWrite(RIGHTDIRECTIONPIN, right_directionPin);
    analogWrite(RIGHTSPEEDPIN, right_value);
    digitalWrite(RIGHTBREAKPIN, right_break);

    Serial.print(left_directionPin);
    Serial.print(" , ");
    Serial.print(left_value);
    Serial.print(" , ");
    Serial.print(left_break);
    Serial.print("    ||    ");
    Serial.print(right_directionPin);
    Serial.print(" , ");
    Serial.print(right_value);
    Serial.print(" , ");
    Serial.print(right_break);
    Serial.println();
}