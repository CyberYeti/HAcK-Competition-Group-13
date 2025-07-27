import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import LiveSensorData from "./components/LiveSensorData";
import axios from "axios";

// Connect to backend
const socket = io("http://localhost:8000");

function App() {
  const [chat, setChat] = useState([]);
  const [promptInput, setPromptInput] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [pictureStatus, setPictureStatus] = useState("");
  const [oledText, setOledText] = useState(""); // 🆕 OLED input

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("picture_taken", (data) => {
      setPictureStatus(data.message);
      setTimeout(() => setPictureStatus(""), 3000);
    });

    return () => {
      socket.off("picture_taken");
    };
  }, []);

  const handleCapture = () => {
    setCapturedImage("/placeholder.png");
    setUploadedImage(null);
    setPromptInput("What do you see in this image?");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file);
      setCapturedImage(URL.createObjectURL(file));
    }
  };

  const handleAnalyze = async () => {
    const formData = new FormData();

    if (uploadedImage) {
      formData.append("image", uploadedImage);
    } else if (capturedImage) {
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      formData.append("image", blob, "captured.png");
    } else {
      console.error("❌ No image to send.");
      return;
    }

    const prompt = promptInput || "Who is in this image?";
    formData.append("prompt", prompt);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/chatgpt-image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const aiReply = res.data.reply || "(No response)";
      setChat((prev) => [
        ...prev,
        { role: "user", content: prompt },
        { role: "assistant", content: aiReply },
      ]);
      setPromptInput("");
    } catch (err) {
      console.error("❌ Vision error:", err);
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Failed to analyze image." },
      ]);
    }
  };

  const handleSend = async () => {
    if (!promptInput.trim()) return;

    const userMessage = { role: "user", content: promptInput };
    setChat((prev) => [...prev, userMessage]);

    try {
      const res = await axios.post("http://localhost:8000/api/chatgpt", {
        prompt: promptInput,
      });

      const aiReply = res.data.reply || "(No response)";
      const assistantMessage = { role: "assistant", content: aiReply };
      setChat((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Text prompt error:", err);
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Error getting reply from assistant.",
        },
      ]);
    }

    setPromptInput("");
  };

  const handleSendToOLED = () => {
    if (!oledText.trim()) return;
    socket.emit("oled_message", { message: oledText }); // 🟢 Emit to server
    setOledText(""); // Clear input
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}> Operator Dashboard</h1>

      {/* 📡 Sensor Data */}
      <div style={{ marginBottom: "1.5rem" }}>
        <LiveSensorData />
      </div>

      {/* 🖥️ Send to OLED Text Box */}
      <div style={{ margin: "2rem 0", textAlign: "center" }}>
        <input
          type="text"
          placeholder="Type a message for the OLED..."
          value={oledText}
          onChange={(e) => setOledText(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            width: "100%",
            maxWidth: "400px",
            fontSize: "1rem",
          }}
        />
        <button
          onClick={handleSendToOLED}
          style={{
            marginLeft: "1rem",
            padding: "0.5rem 1rem",
            fontSize: "1rem",
          }}
        >
          📤 Send to OLED
        </button>
      </div>

      {/* 📷 Upload / Placeholder */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <input type="file" accept="image/*" onChange={handleFileUpload} />
        <button onClick={handleCapture}>📸 Use Placeholder</button>
      </div>

      {/* 🖼 Show Image */}
      {capturedImage && (
        <div style={{ marginBottom: "1rem" }}>
          <img
            src={capturedImage}
            alt="Captured"
            style={{ width: "100%", borderRadius: 8, border: "1px solid #ccc" }}
          />
        </div>
      )}

      {(uploadedImage || capturedImage) && (
        <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <button onClick={handleAnalyze}>🔍 Analyze Image</button>
        </div>
      )}

      {/* 📝 Text Input in Middle */}
      <div style={{ marginBottom: "2rem" }}>
        <textarea
          placeholder="Ask the assistant anything..."
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            resize: "none",
            fontSize: "1rem",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "flex-end",
            marginTop: "0.5rem",
          }}
        >
          <button onClick={handleSend}>Send</button>
          <button onClick={handleAnalyze}>🔍 Analyze Image</button>
        </div>
      </div>

      {/* 🧠 Chat History at Bottom */}
      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
          background: "#fafafa",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Assistant Conversation</h3>
        {chat.map((msg, i) => (
          <div
            key={i}
            style={{
              background: msg.role === "user" ? "#e6f0ff" : "#f0f0f0",
              padding: "0.75rem",
              borderRadius: "6px",
              marginBottom: "0.5rem",
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            <b>{msg.role === "user" ? "You" : "AI"}:</b> {msg.content}
          </div>
        ))}
      </div>

      {/* ✅ Status Message */}
      {pictureStatus && <p style={{ color: "green" }}>{pictureStatus}</p>}
    </div>
  );
}

export default App;
