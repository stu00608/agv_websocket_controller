import websocket
import json

config = json.load(open("./assets/config/config.json"))

# Connect to WebSocket server
ws = websocket.WebSocket()
ws.connect(config["websocketServerIP"])
print("Connected to WebSocket server")

data = {"x": 1.4, "z": 0.6}
ws.send(json.dumps(data))

# Wait for server to respond and print it
result = ws.recv()
print("Received: " + result)

# Gracefully close WebSocket connection
ws.close()
