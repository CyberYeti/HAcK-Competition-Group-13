import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import LiveSensorData from "./components/LiveSensorData";

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

  const handleTakePicture = () => {
    socket.emit("take_picture");
  };

  const handleSendToOLED = () => {
    if (oledText.trim()) {
      socket.emit("oled_message", { message: oledText });
      setOledText("");
    }
  };

  const handleSend = async () => {
    if (!promptInput.trim()) return;

    const userMessage = { role: "user", content: promptInput };
    setChat((prev) => [...prev, userMessage]);

    if (uploadedImage || capturedImage) {
      const formData = new FormData();
      if (uploadedImage) {
        formData.append("image", uploadedImage);
      } else if (capturedImage) {
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        formData.append("image", blob, "captured.png");
      }
      formData.append("prompt", promptInput);

      try {
        const res = await axios.post(
          "http://localhost:8000/api/chatgpt-image",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        const aiReply = res.data.reply || "(No response)";
        setChat((prev) => [...prev, { role: "assistant", content: aiReply }]);
      } catch (err) {
        console.error("Image+Prompt error:", err);
        setChat((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "❌ Failed to analyze image with prompt.",
          },
        ]);
      }
    } else {
      try {
        const res = await axios.post("http://localhost:8000/api/chatgpt", {
          prompt: promptInput,
        });
        const aiReply = res.data.reply || "(No response)";
        setChat((prev) => [...prev, { role: "assistant", content: aiReply }]);
      } catch (err) {
        console.error("Text-only error:", err);
        setChat((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ Error getting reply from assistant.",
          },
        ]);
      }
    }

    setPromptInput("");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>🕵️ Operator Dashboard</h1>

      {/* Sensor Data */}
      <LiveSensorData />

      {/* OLED Text Input + Button */}
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={oledText}
          onChange={(e) => setOledText(e.target.value)}
          placeholder="Send message to OLED"
          style={{ flex: 1, padding: "0.5rem", borderRadius: "4px" }}
        />
        <button onClick={handleSendToOLED}>📤 Send to OLED</button>
      </div>

      {/* Take Picture Button */}
      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <button onClick={handleTakePicture}>📸 Take a Picture</button>
      </div>

      {/* Upload Image */}
      <div style={{ marginTop: "2rem" }}>
        <input type="file" accept="image/*" onChange={handleFileUpload} />
      </div>

      {/* Capture Placeholder */}
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <button onClick={handleCapture}>📷 Use Placeholder</button>
      </div>

      {/* Show Captured Image */}
      {capturedImage && (
        <div style={{ marginTop: "10px" }}>
          <img
            src={capturedImage}
            alt="Captured"
            style={{ width: "100%", borderRadius: 8, border: "1px solid #ccc" }}
          />
        </div>
      )}

      {/* Analyze Button */}
      {(uploadedImage || capturedImage) && (
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button onClick={handleSend}>🔍 Analyze + Ask</button>
        </div>
      )}

      {/* Prompt Text Input */}
      <div style={{ marginTop: "2rem" }}>
        <textarea
          placeholder="Ask the assistant anything..."
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: "0.5rem", borderRadius: "4px" }}
        />
        <button onClick={handleSend} style={{ marginTop: "0.5rem" }}>
          Send
        </button>
      </div>

      {/* Chat History */}
      <div style={{ marginTop: "2rem" }}>
        {chat.map((msg, i) => (
          <div
            key={i}
            style={{
              background: msg.role === "user" ? "#eef" : "#f5f5f5",
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

      {/* Status Message */}
      {pictureStatus && <p style={{ color: "green" }}>{pictureStatus}</p>}
    </div>
  );
}

export default App;