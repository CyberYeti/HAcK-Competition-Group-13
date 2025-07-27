require("dotenv").config();
const fs = require("fs");
const cors = require("cors");
const express = require("express");
const http = require("http");
const MQTT = require("mqtt");
const { spawn } = require("child_process");
const APP = express();
const server = http.createServer(APP);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const CLIENTID = "frontend";

const client = MQTT.connect(process.env.CONNECT_URL, {
  clientId: CLIENTID,
  clean: true,
  connectTimeout: 3000,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  reconnectPeriod: 10000,
  debug: true,
  rejectUnauthorized: false, // ⚠️ Keep false for local testing, remove in prod
});

// MQTT Event Listeners
client.on("error", (error) => {
  console.error("MQTT Connection error:", error);
});

client.on("close", () => {
  console.log("MQTT Connection closed");
});

client.on("offline", () => {
  console.log("MQTT Client offline");
});

client.on("reconnect", () => {
  console.log("MQTT attempting to reconnect...");
});

// MQTT Subscribe Topics
client.on("connect", async () => {
  console.log("✅ MQTT Connected");

  ["ultrasonic", "temp", "humidity", "light"].forEach((topic) => {
    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`❌ Subscription error for '${topic}':`, err);
      } else {
        console.log(`📡 Subscribed to '${topic}'`);
      }
    });
  });
});

// Allow all origins (CORS)
APP.use(cors({ origin: "*" }));
APP.use(express.json());

// Store latest sensor readings
let latestTemp = null;
let latestUltrasonic = null;
let latestHumidity = null;
let latestLight = null;

// WebSocket Handling
io.on("connection", (socket) => {
  console.log("🟢 Frontend connected to socket");

  // Initial data
  if (latestTemp) socket.emit("temp", latestTemp);
  if (latestUltrasonic) socket.emit("ultrasonic", latestUltrasonic);
  if (latestHumidity) socket.emit("humidity", latestHumidity);
  if (latestLight) socket.emit("light", latestLight);

  // 🖥️ OLED Message
  socket.on("oled_message", (data) => {
    const text = data.message || "";
    console.log("📤 Sending to OLED screen:", text);
    client.publish("oled_display", text.toString());
  });

  // 🧪 Raw display channel
  socket.on("display", (message) => {
    console.log("🧪 Received 'display':", message);
    client.publish("display", message.toString());
  });

  // 📸 Take picture and analyze
  socket.on("take_picture", () => {
    console.log("📸 Taking picture and getting AI description...");

    const pythonProcess = spawn(
      "python3",
      ["../AI/receive.py", "get_description"],
      {
        cwd: __dirname,
      }
    );

    pythonProcess.stdout.on("data", (data) => {
      console.log(`🐍 Python output: ${data}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`🐍 Python error: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      console.log(`📦 Python script finished with code ${code}`);
      socket.emit("picture_taken", {
        success: code === 0,
        message:
          code === 0
            ? "Picture analyzed successfully!"
            : "Failed to analyze picture",
      });
    });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Frontend disconnected from socket");
  });
});

// Emit sensor values every 1 second
setInterval(() => {
  io.emit("temp", latestTemp);
  io.emit("ultrasonic", latestUltrasonic);
  io.emit("humidity", latestHumidity);
  io.emit("light", latestLight);
}, 1000);

// Update latest values when received from broker
client.on("message", (TOPIC, payload) => {
  const value = payload.toString();
  console.log("📥 MQTT message:", TOPIC, value);

  switch (TOPIC) {
    case "temp":
      latestTemp = value;
      break;
    case "ultrasonic":
      latestUltrasonic = value;
      break;
    case "humidity":
      latestHumidity = value;
      break;
    case "light":
      latestLight = value;
      break;
    default:
      console.warn("⚠️ Unknown topic:", TOPIC);
  }
});

// Start server
server.listen(8000, () => {
  console.log("🚀 Server is running on port 8000");
});
