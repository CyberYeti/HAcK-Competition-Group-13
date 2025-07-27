from machine import ADC, Pin
from time import sleep

ldr = ADC(Pin(26))
Rfixed = 1000  # 1kΩ resistor
Vcc = 3.3      # supply voltage
A = 2.10       # Multiplier
B = -0.25      # Exponent

while True:
    raw = ldr.read_u16()
    Vout = (raw / 65535) * Vcc

    # Calculate LDR resistance using voltage divider formula
    if Vout != 0:
        Rldr = Rfixed * (Vcc - Vout) / Vout
        lumen = A * (Rldr ** B)
        print(f"ADC: {raw}, Vout: {Vout:.2f}V, Rldr: {Rldr:.2f}Ω, Estimated lumen: {lumen:.2f}")
    else:
        print("ADC value too low to calculate resistance.")

    sleep(1)