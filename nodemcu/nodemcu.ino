#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>

// 設定AP參數
const char* ssid = "MovableBag";
const char* password = "kaipodoctor";
const int webSocketPort = 81;

// 建立Websocket伺服器
WebSocketsServer webSocket = WebSocketsServer(webSocketPort);

void setup() {
  // 連接到AP
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(IPAddress(192, 168, 1, 1), IPAddress(192, 168, 1, 1), IPAddress(255, 255, 255, 0));
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

void webSocketEvent(uint8_t num, WStype_t type, const uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      // 斷開連接
      break;
    case WStype_CONNECTED:
      // 新客戶端連接
      webSocket.sendTXT(num, "Hello, client!");
      break;
    case WStype_TEXT:
      // 收到文本消息
      Serial.println("Received message: " + String((char *)payload));
      String response = "You said: ";
      response += String((char*)payload);
      webSocket.sendTXT(num, response);
      break;
  }
}
