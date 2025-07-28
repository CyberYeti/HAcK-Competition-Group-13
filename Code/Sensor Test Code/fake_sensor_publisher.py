import time
import random
import paho.mqtt.client as mqtt
import ssl

print("📡 Starting fake sensor publisher...")

MQTT_BROKER = "d22369f98277406bb11d46bfb38d7110.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "Team_13"
MQTT_PASS = "Half_degen5"

TOPIC_TEMP = "temp"
TOPIC_HUMIDITY = "humidity"
TOPIC_LIGHT = "light"
TOPIC_ULTRASONIC = "ultrasonic"

try:
    client = mqtt.Client()
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.tls_set(tls_version=ssl.PROTOCOL_TLS)
    print("🔐 Connecting to MQTT broker...")
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    print("✅ Connected!")
except Exception as e:
    print(f"❌ Failed to connect to MQTT broker: {e}")
    exit(1)

while True:
    temp = round(random.uniform(68, 78), 1)
    humidity = round(random.uniform(30, 55), 1)
    light = round(random.uniform(300, 700), 1)
    distance = round(random.uniform(10, 60), 1)

    print(f"📡 Temp: {temp} °F, Humidity: {humidity} %, Light: {light} lm, Distance: {distance} cm")

    client.publish(TOPIC_TEMP, str(temp))
    client.publish(TOPIC_HUMIDITY, str(humidity))
    client.publish(TOPIC_LIGHT, str(light))
    client.publish(TOPIC_ULTRASONIC, str(distance))

    time.sleep(2)