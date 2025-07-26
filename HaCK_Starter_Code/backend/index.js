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
const axios = require("axios");

// Enable CORS for frontend
APP.use(cors({ origin: "*" }));
APP.use(express.json());

// Initialize socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// MQTT Connection
const CLIENTID = "frontend";
const client = MQTT.connect(process.env.CONNECT_URL, {
  clientId: CLIENTID,
  clean: true,
  connectTimeout: 3000,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  reconnectPeriod: 10000,
  rejectUnauthorized: false, // ⚠️ Use false only for testing
});

// MQTT Debugging
client.on("error", (err) => console.error("❌ MQTT Error:", err));
client.on("close", () => console.log("🔌 MQTT Connection closed"));
client.on("offline", () => console.log("⚠️ MQTT Client offline"));
client.on("reconnect", () => console.log("🔁 MQTT Reconnecting..."));

// Sensor state
let latestTemp = null;
let latestHumidity = null;
let latestLight = null;
let latestUltrasonic = null;

// MQTT Topics to subscribe to
const topics = ["temp", "humidity", "light", "ultrasonic"];

// On MQTT Connect
client.on("connect", () => {
  console.log("✅ MQTT Connected");
  topics.forEach((topic) => {
    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`❌ Subscription failed: ${topic}`, err);
      } else {
        console.log(`📡 Subscribed to '${topic}'`);
      }
    });
  });
});

// Receive MQTT messages
client.on("message", (topic, payload) => {
  const value = payload.toString();
  console.log(`📥 ${topic}: ${value}`);

  if (topic === "temp") latestTemp = value;
  if (topic === "humidity") latestHumidity = value;
  if (topic === "light") latestLight = value;
  if (topic === "ultrasonic") latestUltrasonic = value;

  io.emit(topic, value); // 📤 Emit to frontend via socket.io
});

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log("🧠 Frontend connected:", socket.id);

  // Send latest on connect
  if (latestTemp) socket.emit("temp", latestTemp);
  if (latestHumidity) socket.emit("humidity", latestHumidity);
  if (latestLight) socket.emit("light", latestLight);
  if (latestUltrasonic) socket.emit("ultrasonic", latestUltrasonic);

  socket.on("display", (message) => {
    console.log("📲 Message from frontend:", message);
    client.publish("display", message.toString());
  });

  socket.on("take_picture", () => {
    console.log("📸 Taking picture...");
    const pythonProcess = spawn(
      "python3",
      ["../AI/receive.py", "get_description"],
      {
        cwd: __dirname,
      }
    );

    pythonProcess.stdout.on("data", (data) => {
      console.log(`📷 Python output: ${data}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`🐍 Python error: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      console.log(`🔚 Python finished with code ${code}`);
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
    console.log("❎ Frontend disconnected:", socket.id);
  });
});

// Periodic broadcast (optional)
setInterval(() => {
  io.emit("temp", latestTemp);
  io.emit("humidity", latestHumidity);
  io.emit("light", latestLight);
  io.emit("ultrasonic", latestUltrasonic);
}, 1000);

// ChatGPT proxy endpoint
APP.post("/api/chatgpt", async (req, res) => {
  const { prompt } = req.body;
  try {
    const gptRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const reply = gptRes.data.choices[0].message.content;
    res.json({ response: reply });
  } catch (error) {
    console.error("❌ ChatGPT Error:", error.response?.data || error.message);
    res.status(500).json({ error: "ChatGPT call failed" });
  }
});

// Start server
server.listen(8000, () => {
  console.log("🚀 Server running on http://localhost:8000");
});
