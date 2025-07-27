require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
const MQTT = require("mqtt");

// Setup Express + HTTP + Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Middleware
app.use(cors());
app.use(express.json());

// Multer config (image upload to memory)
const upload = multer({ storage: multer.memoryStorage() });

// MQTT Setup
const client = MQTT.connect(process.env.CONNECT_URL, {
  clientId: "frontend",
  clean: true,
  connectTimeout: 4000,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  reconnectPeriod: 5000,
  rejectUnauthorized: false,
});

// ✅ MQTT Event Handlers
client.on("connect", () => {
  console.log("✅ MQTT connected");

  // Subscribe to any topics if needed
  client.subscribe("temp");
  client.subscribe("humidity");
  client.subscribe("light");
  client.subscribe("ultrasonic");
});

client.on("error", (err) => console.error("❌ MQTT error:", err));
client.on("message", (topic, payload) => {
  console.log("📡 MQTT:", topic, "->", payload.toString());
  io.emit(topic, payload.toString()); // Broadcast sensor data to frontend
});

// ✅ WebSocket logic
io.on("connection", (socket) => {
  console.log("🔌 Client connected via socket");

  socket.on("oled_message", (data) => {
    const msg = data.message;
    console.log("📤 OLED Message:", msg);
    client.publish("display", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// ✅ ROUTE: TEXT-ONLY PROMPT
app.post("/api/chatgpt", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });
  console.log("📥 Text prompt:", prompt);

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    console.log("🤖 GPT:", reply);
    res.json({ reply });
  } catch (error) {
    console.error("❌ GPT text error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get GPT reply" });
  }
});

// ✅ ROUTE: IMAGE + PROMPT (GPT-4o Vision)
app.post("/api/chatgpt-image", upload.single("image"), async (req, res) => {
  const { prompt } = req.body;
  const file = req.file;

  if (!file || !prompt) {
    return res.status(400).json({ error: "Image and prompt required" });
  }

  const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: base64Image },
              },
            ],
          },
        ],
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    console.log("🧠 GPT-4o Vision:", reply);
    res.json({ reply });
  } catch (error) {
    console.error(
      "❌ GPT Vision error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

// ✅ Start the combined server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
