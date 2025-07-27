require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const app = express();
const port = 8000;

// CORS and JSON support
app.use(cors());
app.use(express.json());

// Set up multer to store image in memory
const upload = multer({ storage: multer.memoryStorage() });

// ✅ ROUTE: TEXT-ONLY PROMPT
app.post("/api/chatgpt", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) return res.status(400).json({ error: "Missing prompt" });
  console.log("📥 Received text prompt:", prompt);

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
    console.log("🤖 GPT reply:", reply);
    res.json({ reply });
  } catch (error) {
    console.error("❌ Text API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get GPT reply" });
  }
});

// ✅ ROUTE: IMAGE + PROMPT (GPT-4 VISION)
app.post("/api/chatgpt-image", upload.single("image"), async (req, res) => {
  const { prompt } = req.body;
  const file = req.file;

  if (!file || !prompt) {
    console.error("❌ Missing file or prompt");
    return res.status(400).json({ error: "Image and prompt required" });
  }

  console.log("📥 Received image prompt:", prompt);
  console.log("📷 File name:", file.originalname, "| Type:", file.mimetype);

  try {
    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString(
      "base64"
    )}`;

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
    console.log("🧠 GPT-4 Vision replied:", reply);
    res.json({ reply });
  } catch (error) {
    console.error(
      "❌ Vision API error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
