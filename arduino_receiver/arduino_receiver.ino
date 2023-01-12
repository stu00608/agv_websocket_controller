// This code is wrote for Hit And Runs AGV, runs in the Arduino Mega 2560 board
// as a motor controller.

#include <ArduinoJson.h>
#include <SoftwareSerial.h>  //實例化軟串口

#define WIDTH 1.0
#define WHEEL_RADIUS 1.0
#define directionPin_L 13
#define speedPin_L 11
#define breakPin_L 12
#define directionPin_R 8
#define speedPin_R 6
#define breakPin_R 7

// Structs
struct Omegas {
    float omega_left;
    float omega_right;
};

int control_mode, auto_mode, auto_mode_1_round;

void setup() {
    pinMode(directionPin_L, OUTPUT);
    pinMode(speedPin_L, OUTPUT);
    pinMode(breakPin_L, OUTPUT);
    pinMode(directionPin_R, OUTPUT);
    pinMode(speedPin_R, OUTPUT);
    pinMode(breakPin_R, OUTPUT);

    Serial.begin(9600);
    Serial1.begin(38400);
    Serial.println("OK");
}

void loop() {
    if (Serial1.available() > 0) {
        StaticJsonDocument<200> json;
        String receivedString = Serial1.readStringUntil('#');
        DeserializationError err = deserializeJson(json, receivedString);
        if (err) {
            Serial.println(err.c_str());
            return;
        }

        control_mode = json["control_mode"];
        auto_mode = json["auto_mode"];
        auto_mode_1_round = json["auto_mode_1_round"];
        Omegas global_velocity = calc_velocity(json["x"], json["z"]);

        int left_sign = sign(global_velocity.omega_left);
        float left_value = abs(global_velocity.omega_left);
        int right_sign = sign(global_velocity.omega_right);
        float right_value = abs(global_velocity.omega_right);

        if (control_mode != 2) {
            motorControl(left_sign, left_value, right_sign, right_value);
        }
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

void motorControl(int left_sign, float left_value, int right_sign,
                  float right_value) {
    int right_directionPin, left_directionPin, left_break, right_break;

    if (left_sign == 1) {
        left_directionPin = 1;
        left_break = 1;
    } else if (left_sign == -1) {
        left_directionPin = 0;
        left_break = 1;
    } else {
        left_break = 0;
    }

    if (right_sign == 1) {
        right_directionPin = 1;
        right_break = 1;
    } else if (right_sign == -1) {
        right_directionPin = 0;
        right_break = 1;
    } else {
        right_break = 0;
    }

    digitalWrite(directionPin_L, left_directionPin);
    analogWrite(speedPin_L, left_value);
    digitalWrite(breakPin_L, left_break);

    digitalWrite(directionPin_R, right_directionPin);
    analogWrite(speedPin_R, right_value);
    digitalWrite(breakPin_R, right_break);

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