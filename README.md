# AGV Websocket Controller in RPi

# Rpi Setup

## Write OS
* Using tools like `Raspberry Pi Imager` to write Pi OS (64-bit is good).
* Make sure you setup username, password, wifi settings correctly, you need internet access for updating and downloading packages.

## Install dependencies
```
sudo sh -c 'echo "LANG=en_US.UTF-8" >> /etc/environment && echo "LC_ALL=en_US.UTF-8" >> /etc/environment'
sudo sh -c "echo 'hdmi_force_hotplug=1' >> /boot/config.txt"

sudo apt-get update -y && sudo apt-get upgrade -y && sudo apt-get install git vim tmux net-tools gcc g++ make curl gnupg -y

sudo reboot now
```

```bash
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | sudo apt-key add -
echo 'deb https://deb.nodesource.com/node_16.x buster main' | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt-get update -y && sudo apt-get install -y nodejs
node -v

sudo apt-get install -y pigpio

git clone https://github.com/stu00608/agv_websocket_controller.git && cd agv_websocket_controller
npm install pigpio ws lite-server
sudo node lib_test.js

sudo ./setup_ap.sh Movablebag_Pi4 kaipodoctor

sudo sed -i '/^network={/,/^}/d' /etc/wpa_supplicant/wpa_supplicant.conf

sudo reboot now
```
