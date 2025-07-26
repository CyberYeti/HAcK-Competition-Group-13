from machine import Pin
import time
pinled = Pin(25, Pin.OUT)
# blink the LED to write out "Joel"

while True:
    pinled.on()
    time.sleep(0.1)
    pinled.off()
    time.sleep(0.1)
    pinled.on()
    time.sleep(0.3)
    pinled.off()
    time.sleep(0.1)
    pinled.on()
    time.sleep(0.3)
    pinled.off()
    time.sleep(0.1)
    pinled.on()
    time.sleep(0.3) # Morse code for "J"
    pinled.off()
    time.sleep(0.3) # pause between letters
    pinled.on()
    time.sleep(0.3)
    pinled.off()
    time.sleep(0.1)
    pinled.on()
    time.sleep(0.3)
    pinled.off()
    time.sleep(0.1)
    pinled.on()
    time.sleep(0.3) # Morse code for "O"
    pinled.off()
    time.sleep(0.3) # pause between letters
    pinled.on()
    time.sleep(0.1) # Morse code for "E"
    pinled.off()
    time.sleep(0.3) #pause
    pinled.on()
    time.sleep(0.1)
    pinled.off()
    time.sleep(0.1)
    pinled.on()
    time.sleep(0.3)
    pinled.off()
    time.sleep(0.1)
    pinled.on()
    time.sleep(0.1)
    pinled.off()
    time.sleep(0.1)
    pinled.on()
    time.sleep(0.1) # Morse code for "L"
    pinled.off()
    time.sleep(0.7) #pause before repeating the sequence
