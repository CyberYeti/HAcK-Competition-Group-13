require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const http = require("http");
const MQTT = require("mqtt");
const { spawn } = require("child_process");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

// MQTT setup
const client = MQTT.connect(process.env.CONNECT_URL, {
  clientId: "frontend",
  clean: true,
  connectTimeout: 4000,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASS,
  reconnectPeriod: 5000,
  rejectUnauthorized: false,
});

client.on("connect", () => {
  console.log("✅ MQTT connected");
  client.subscribe("temp");
  client.subscribe("humidity");
  client.subscribe("light");
  client.subscribe("ultrasonic");
});

client.on("error", (err) => console.error("❌ MQTT error:", err));

let latestTemp = null;
let latestUltrasonic = null;
let latestHumidity = null;
let latestLight = null;

client.on("message", (topic, payload) => {
  const data = payload.toString();
  console.log("📡 MQTT:", topic, "->", data);

  if (topic === "temp") latestTemp = data;
  else if (topic === "ultrasonic") latestUltrasonic = data;
  else if (topic === "humidity") latestHumidity = data;
  else if (topic === "light") latestLight = data;

  io.emit(topic, data);
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected via socket");

  if (latestTemp) socket.emit("temp", latestTemp);
  if (latestUltrasonic) socket.emit("ultrasonic", latestUltrasonic);
  if (latestHumidity) socket.emit("humidity", latestHumidity);
  if (latestLight) socket.emit("light", latestLight);

  socket.on("oled_message", (data) => {
    const msg = data.message;
    console.log("📤 OLED Message:", msg);
    client.publish("display", msg);
  });

  // Handle take picture request
  socket.on('take_picture', () => {
    console.log('📸 Taking picture and getting AI description...');
    
    // Execute the Python script
    const pythonProcess = spawn('python3', ['../AI/receive.py'],  {
      cwd: __dirname
    });

    pythonProcess.stdout.on("data", (data) => {
      console.log(`Python output: ${data}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python error: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      console.log(`Python script finished with code ${code}`);
      if (code === 0) {
        socket.emit("picture_taken", {
          success: true,
          message: "Picture analyzed successfully!",
        });
      } else {
        socket.emit("picture_taken", {
          success: false,
          message: "Failed to analyze picture",
        });
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

setInterval(() => {
  io.emit("temp", latestTemp);
  io.emit("ultrasonic", latestUltrasonic);
  io.emit("humidity", latestHumidity);
  io.emit("light", latestLight);
}, 1000);

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

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
