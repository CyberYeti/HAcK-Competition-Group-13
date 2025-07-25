from machine import Pin, I2C
import SimpleDisplay
import time

display = SimpleDisplay.Display(17, 16)

text = """"As expected of an Elemental Crystal from a Grand Mage, it allowed me to condense Death Magic within my body in such a short time. Now my strength is barely enough for self-protection." """
text = "Apple"
display.parseMessage(text)

for i in range(10):
    display.displayText(i)
    time.sleep(1)


