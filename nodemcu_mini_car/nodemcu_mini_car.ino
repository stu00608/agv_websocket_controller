#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <stdlib.h>

#define MOTOR_IN1 D4
#define MOTOR_IN2 D3
#define MOTOR_IN3 D2
#define MOTOR_IN4 D1
#define MOTOR_ENA D5
#define MOTOR_ENB D6

#define WIDTH 1.0
#define WHEEL_RADIUS 1.0

// Structs
struct Omegas {
    float omega_left;
    float omega_right;
};

// Constants
const char* ssid = "cilab";
const char* password = "dogbrother";

// Globals
WebSocketsServer webSocket = WebSocketsServer(80);
Omegas global_velocity;

// Called when receiving any WebSocket message
void onWebSocketEvent(uint8_t num,
                      WStype_t type,
                      uint8_t * payload,
                      size_t length) {

  // Figure out the type of WebSocket event
  switch(type) {

    // Client has disconnected
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;

    // New client has connected
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[%u] Connection from ", num);
        Serial.println(ip.toString());
      }
      break;

    // Echo text message back to client
    case WStype_TEXT:
      {
        StaticJsonDocument<200> json;
        DeserializationError err = deserializeJson(json, payload);
        if (err) {
          Serial.print(F("deserializeJson() failed with code "));
          Serial.println(err.c_str());
          return;
        }
        float x = float(json["x"]);
        float z = float(json["z"]);
        global_velocity = calc_velocity(x, z);
        // Serial.printf("x: %f sign: %d\n", abs(x), sign(x));
        // Serial.printf("z: %f sign: %d\n", abs(z), sign(z));
        // Serial.printf("Velocity:\n\tomega_left: %f\n\tomega_right: %f\n", global_velocity.omega_left, global_velocity.omega_right);
        // Serial.printf("--------------\n");

        int left_sign = sign(global_velocity.omega_left);
        float left_value = abs(global_velocity.omega_left);
        int right_sign = sign(global_velocity.omega_right);
        float right_value = abs(global_velocity.omega_right);

        left_rotate(left_sign, left_value);
        right_rotate(right_sign, right_value);
        send_information();
        Serial.printf("Velocity:\n\tleft: %f sign: %d\n\tright: %f sign: %d\n", left_value, left_sign, right_value, right_sign);
        Serial.printf("--------------\n");
      }
      break;
    // For everything else: do nothing
    case WStype_BIN:
    case WStype_ERROR:
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:
    default:
      break;
  }
}

/**
 * Returns the sign of a value as an integer.
 *
 * @tparam T The type of the value.
 * @param val The value whose sign should be returned.
 * @return 1 if the value is greater than zero, -1 if the value is less than zero,
 *         and 0 if the value is equal to zero.
 */
template <typename T> int sign(T val) {
    return (T(0) < val) - (val < T(0));
}

float mapfloat(float x, float in_min, float in_max, float out_min, float out_max)
{
  return (float)(x - in_min) * (out_max - out_min) / (float)(in_max - in_min) + out_min;
}

Omegas calc_velocity(float x, float z){
  Omegas res;

  res.omega_left  = ((x - (z * WIDTH)/2.0)/WHEEL_RADIUS);
  res.omega_left = fmin(1.0, fmax(-1.0, (res.omega_left - (-1.0)) * (1.0 - (-1.0)) / (1.0 - (-1.0)) + (-1.0)));
  res.omega_left *= 255.0;
  res.omega_right = ((x + (z * WIDTH)/2.0)/WHEEL_RADIUS);
  res.omega_right = fmin(1.0, fmax(-1.0, (res.omega_right - (-1.0)) * (1.0 - (-1.0)) / (1.0 - (-1.0)) + (-1.0)));
  res.omega_right *= 255.0;
  return res;
}

void send_information(){
  StaticJsonDocument<200> json;
  json["left_motor_speed"] = global_velocity.omega_left;
  json["right_motor_speed"] = global_velocity.omega_right;
  char data[200];
  size_t len = serializeJson(json, data);
  webSocket.sendTXT(0, data);
}

void pinInit(){
  pinMode(MOTOR_IN1, OUTPUT);
  pinMode(MOTOR_IN2, OUTPUT);
  pinMode(MOTOR_IN3, OUTPUT);
  pinMode(MOTOR_IN4, OUTPUT);
  pinMode(MOTOR_ENA, OUTPUT);
  pinMode(MOTOR_ENB, OUTPUT);
}

void left_rotate(int direction, int value){
  if(direction>0){
    digitalWrite(MOTOR_IN1, LOW);
    digitalWrite(MOTOR_IN2, HIGH);
  }else{
    digitalWrite(MOTOR_IN1, HIGH);
    digitalWrite(MOTOR_IN2, LOW);
  }
  analogWrite(MOTOR_ENA, value);
}

void right_rotate(int direction, int value){
  if(direction>0){
    digitalWrite(MOTOR_IN3, LOW);
    digitalWrite(MOTOR_IN4, HIGH);
  }else{
    digitalWrite(MOTOR_IN3, HIGH);
    digitalWrite(MOTOR_IN4, LOW);
  }
  analogWrite(MOTOR_ENB, value);
}

void setup() {

  // Start Serial port
  Serial.begin(115200);

  // Connect to access point
  Serial.println("Connecting");
  WiFi.begin(ssid, password);
  while ( WiFi.status() != WL_CONNECTED ) {
    delay(500);
    Serial.print(".");
  }

  // Print our IP address
  Serial.println("Connected!");
  Serial.print("My IP address: ");
  Serial.println(WiFi.localIP());

  // Start WebSocket server and assign callback
  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);

  pinInit();
}

void loop() {
  // Look for and handle WebSocket data
  webSocket.loop();
}