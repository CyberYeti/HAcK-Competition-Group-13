#include <WiFi.h>
#include <PubSubClient.h>

// Wi-Fi credentials
const char* ssid = "HAcK-Project-WiFi-2";
const char* password = "UCLA.HAcK.2024.Summer";

// MQTT broker details
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_topic = "esp32cam/images";

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32CAMClient")) {
      client.subscribe(mqtt_topic);
    } else {
      delay(5000);
    }
  }
}

void setup() {
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  // Simulated image URL (replace with actual upload logic)
  String imageUrl = "https://yourserver.com/image.jpg";

  client.publish(mqtt_topic, imageUrl.c_str());
  delay(5000); // Adjust interval as needed
}