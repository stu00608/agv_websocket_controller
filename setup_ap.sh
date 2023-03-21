#!/bin/bash

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root."
    exit 1
fi

# Check if SSID and password are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: sudo ./setup_ap.sh <SSID> <PASSWORD>"
    exit 1
fi

# Update the package list and upgrade any installed packages
sudo apt-get update -y && sudo apt-get upgrade -y

# Install hostapd and dnsmasq if not already installed
sudo apt-get install -y hostapd dnsmasq bridge-utils

# Stop the hostapd and dnsmasq services
sudo systemctl stop hostapd
sudo systemctl stop dnsmasq

# Unmask hostapd and dnsmasq
sudo systemctl unmask hostapd
sudo systemctl unmask dnsmasq

# Configure dhcpcd
cat << EOF >> /etc/dhcpcd.conf
interface wlan0
static ip_address=192.168.4.1/24
denyinterfaces eth0
denyinterfaces wlan0
EOF

# Configure the wlan0 interface
cat << EOF >> /etc/network/interfaces
# interfaces(5) file used by ifup(8) and ifdown(8)
# Include files from /etc/network/interfaces.d:
source /etc/network/interfaces.d/*

auto br0
iface br0 inet manual
bridge_ports eth0 wlan0
EOF

# Configure dnsmasq
cat << EOF >> /etc/dnsmasq.conf
interface=wlan0
  dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
EOF

# Configure hostapd
cat << EOF >> /etc/hostapd/hostapd.conf
interface=wlan0
# bridge=br0
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
ssid=$1
wpa_passphrase=$2
EOF

# Add default hostapd path
echo 'DAEMON_CONF="/etc/hostapd/hostapd.conf"' | sudo tee -a /etc/default/hostapd

# Add network forwarding 
echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf

sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo sh -c "iptables-save > /etc/iptables.ipv4.nat"
iptables-restore < /etc/iptables.ipv4.nat

# Bridging network
sudo brctl addbr br0
sudo brctl addif br0 eth0

sudo route add default gw 192.168.0.1 dev eth0

# Start the dnsmasq and hostapd services
sudo systemctl enable dnsmasq
sudo systemctl enable hostapd

echo "Wireless access point configured with SSID: $1 and password: $2, make sure you reboot the device."
