from machine import Pin, I2C
import SimpleDisplay
import time

display = SimpleDisplay.Display(17, 16)

text = """"As expected of an Elemental Crystal from a Grand Mage, it allowed me to condense Death Magic within my body in such a short time. Now my strength is barely enough for self-protection." """
# text = "Apple"
display.parseMessage(text)

for _ in range(10):
    display.ScrollDown()
    time.sleep(1)

for _ in range(10):
    display.ScrollUp()
    time.sleep(1)



