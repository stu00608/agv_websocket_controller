#!/usr/bin/env python3

import subprocess
import time
from gpiozero import LED

# Set the GPIO pins for the status indicators
success_pin = 5  # GPIO 5 for success
error_pin = 6    # GPIO 6 for error

success_led = LED(success_pin)
error_led = LED(error_pin)

def check_service(service_name):
    try:
        subprocess.check_output(["systemctl", "is-active", "--quiet", service_name])
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    while True:
        hostapd_status = check_service("hostapd")
        dnsmasq_status = check_service("dnsmasq")

        if hostapd_status and dnsmasq_status:
            success_led.on()
            error_led.off()
        else:
            success_led.off()
            error_led.on()

        time.sleep(5)  # Check status every 10 seconds

if __name__ == "__main__":
    main()