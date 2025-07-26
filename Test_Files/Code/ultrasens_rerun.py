from machine import Pin
import time

trigger = Pin(16, Pin.OUT)
echo = Pin(17, Pin.IN)

def get_distance():
    trigger.low()
    time.sleep_us(2)
    trigger.high()
    time.sleep_us(10)
    trigger.low()

    while echo.value() == 0:
        pass
    start = time.ticks_us()

    while echo.value() == 1:
        pass
    end = time.ticks_us()

    duration = time.ticks_diff(end, start)
    distance_cm = (duration * 0.0343) / 2
    return round(distance_cm, 2)

while True:
    dist = get_distance()
    print("Distance:", dist, "cm")
    time.sleep(1)