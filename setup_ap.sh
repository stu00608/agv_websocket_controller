#!/bin/bash

# Check if two parameters are provided
if [ $# -ne 2 ]; then
  echo "Usage: $0 SSID PASSWORD"
  exit 1
fi

SSID="$1"
PASSWORD="$2"

# Install necessary packages
sudo apt update
sudo apt install hostapd dnsmasq -y

# Stop services
sudo systemctl stop hostapd
sudo systemctl stop dnsmasq

# Configure static IP address
# sudo tee /etc/dhcpcd.conf > /dev/null <<EOF
# interface wlan0
# static ip_address=192.168.4.1/24
# nohook wpa_supplicant
# EOF

# Configure DHCP server
sudo tee /etc/dnsmasq.conf > /dev/null <<EOF
interface=wlan0
dhcp-range-192.168.4.2, 192.168.4.100,255.255.255.0, 12h
EOF

# Configure hostapd
sudo tee /etc/hostapd/hostapd.conf > /dev/null <<EOF
interface=wlan0
ssid=$SSID
hw_mode=g
channel=6
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=$PASSWORD
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF

# Configure hostapd service
sudo tee /etc/systemd/system/hostapd.service > /dev/null <<EOF
[Unit]
Description=Advanced IEEE 802.11 AP and IEEE 802.1X/WPA/WPA2/EAP Authenticator
After=network.target

[Service]
Type=forking
PIDFile=/run/hostapd.pid
ExecStart=/usr/sbin/hostapd -B /etc/hostapd/hostapd.conf
ExecReload=/bin/kill -HUP \$MAINPID

[Install]
WantedBy=multi-user.target
EOF

# Configure dnsmasq service
sudo mkdir -p /etc/systemd/system/dnsmasq.service.d && sudo touch /etc/systemd/system/dnsmasq.service.d/local.conf
sudo tee /etc/systemd/system/dnsmasq.service.d/local.conf > /dev/null <<EOF
[Service]
ExecStartPre=/usr/sbin/iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
ExecStopPost=/usr/sbin/iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
EOF

# Enable and start services
sudo systemctl unmask hostapd
sudo systemctl unmask dnsmasq
sudo systemctl enable hostapd
sudo systemctl enable dnsmasq
sudo systemctl start hostapd
sudo systemctl start dnsmasq
