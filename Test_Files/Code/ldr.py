from machine import ADC, Pin
from time import sleep

ldr = ADC(Pin(26))  # GPIO26 is ADC0

while True:
    value = ldr.read_u16()  # 16-bit analog value (0–65535)
    print("LDR Value:", value)
    sleep(0.5)