from connections import connect_mqtt, connect_internet
from machine import ADC, Pin
from time import sleep, sleep_us, ticks_us, ticks_diff
import dht
import SimpleDisplay

#Message Stuff
hasIncMsg = False

def create_callback(display):
    def callback(topic, msg):
        global hasIncMsg
        text = msg.decode()
        hasIncMsg = True
        print("Received:", text)
        display.PrintMessage(text)
    return callback

# photoresistor
def getPhotoresistor():
    ldr = ADC(Pin(26))
    Rfixed = 1000
    Vcc = 3.3
    A = 2.10
    B = -0.25

    raw = ldr.read_u16()
    Vout = (raw / 65535) * Vcc

    if Vout != 0:
        Rldr = Rfixed * (Vcc - Vout) / Vout
        lumen = A * (Rldr ** B)
        #print(f"[Photoresistor] ADC: {raw}, Vout: {Vout:.2f}V, Rldr: {Rldr:.2f}Ω, Estimated lumen: {lumen:.2f}")
        return lumen
    else:
        print("[Photoresistor] ADC value too low to calculate resistance.")
        return -1

# temperature and humidity sensor
sensor = dht.DHT11(Pin(18))

def getTemp():
    try:
        sensor.measure()
        temp = sensor.temperature()
        hum = sensor.humidity()
        return temp * 9/5 + 32.0
        
    except OSError as e:
        print("[DHT11] Sensor error:", e)

def getHumidity():
    try:
        sensor.measure()
        temp = sensor.temperature()
        return sensor.humidity()
    except OSError as e:
        print("[DHT11] Sensor error:", e)

# ultrasonic distance sensor
trigger = Pin(16, Pin.OUT)
echo = Pin(17, Pin.IN)

def getDist():
    trigger.low()
    sleep_us(2)
    trigger.high()
    sleep_us(10)
    trigger.low()

    while echo.value() == 0:
        pass
    start = ticks_us()

    while echo.value() == 1:
        pass
    end = ticks_us()

    duration = ticks_diff(end, start)
    distance_cm = (duration * 0.0343) / 2
    
    return distance_cm

def main():
    global hasIncMsg
    hasIncMsg = False
    display = SimpleDisplay.Display(21, 20)
    
    try:
        connect_internet("HAcK-Project-WiFi-2",password="UCLA.HAcK.2024.Summer") #ssid (wifi name), pass
        client = connect_mqtt("de81268c7bb146119696d552129e5eea.s1.eu.hivemq.cloud", "Team_13", "Half_degen5") # url, user, pass

        client.set_callback(create_callback(display))
        client.subscribe("display")
        while True:
            client.check_msg()
            
            #Get Sensor Values
            lumens = getPhotoresistor()
            temp = getTemp()
            humid = getHumidity()
            dist = getDist()
            
            #Send info to Website
            client.publish("light", str(lumens))
            client.publish("temp", str(temp))
            client.publish("humidity", str(humid))
            client.publish("ultrasonic", str(dist))
            
            #Print Sensor Values on OLED if there is no unread message from Operator
            if not hasIncMsg:
                lines = []
                lines.append(f"Light: {lumens}")
                lines.append(f"Temp: {temp}")
                lines.append(f"Humid: {humid}")
                lines.append(f"Dist: {dist}")
                display.PrintLines(lines)
                
            #Clear mark operator message as read (resumes printing sensor values )
            if dist < 5:
                hasIncMsg = False
            
            sleep(0.1)

    except KeyboardInterrupt:
        print('keyboard interrupt')
        
        
if __name__ == "__main__":
    main()

