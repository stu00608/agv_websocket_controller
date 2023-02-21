# AGV Websocket Controller

- This repo contains the web front end controller of AGV, sending virtual joystick value to Arduino server via websocket protocol.

## Installation

- NodeJS
- Python

### Web app

- Use npx to host the server.

```
npx serve
```

### Python example

- `pip install -r requirements.txt`

## Configuration

- Change your websocket server url in `assets/config/config.json`.

## NodeMCU

### Installation
1. Arduino -> Preferences -> Additional Boards Manager URLs: `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
2. Tools -> Board -> Boards Manager -> Search `esp8266` -> Install
3. Tools -> Board -> NodeMCU 1.0 (ESP-12E Module)

