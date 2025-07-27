import connections 
from connections import connect_mqtt, connect_internet
import simple
from time import sleep
import random

def main():
    try:
        connect_internet("HAcK-Project-WiFi-2", password= "UCLA.HAcK.2024.Summer")
        client = connect_mqtt("mqtts://de81268c7bb146119696d552129e5eea.s1.eu.hivemq.cloud:8883", "Team_13", "Half_degen5")

        while True:
            # Simulated test values
            temp = str(round(70 + random.uniform(-5, 5), 1))        # e.g., 67.4°F
            humidity = str(round(50 + random.uniform(-10, 10), 1))  # e.g., 57.3%
            light = str(round(150 + random.uniform(-20, 20), 1))    # e.g., 163 lm
            ultrasonic = str(round(10 + random.uniform(0, 5), 1))   # e.g., 13.1 cm

            # Publish to correct topics
            client.publish("temp", temp)
            client.publish("humidity", humidity)
            client.publish("light", light)
            client.publish("ultrasonic", ultrasonic)

            print(f"Published temp={temp}, humidity={humidity}, light={light}, ultrasonic={ultrasonic}")

            sleep(2)

    except KeyboardInterrupt:
        print("⛔ Keyboard interrupt – shutting down")

if __name__ == "__main__":
    main()