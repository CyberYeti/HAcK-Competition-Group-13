import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import LiveSensorData from "./components/LiveSensorData";
import axios from "axios";
import {saveAs} from "file-saver";

// Connect to backend
const socket = io("http://localhost:8000");

function App() {
  const [chat, setChat] = useState([]);
  const [promptInput, setPromptInput] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [pictureStatus, setPictureStatus] = useState("");

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

  //Test Cam Stuff
  // const handleDownloadFromESP32 = () => {
  //   const url = "http://192.168.50.75/1024x768.jpg"; // Replace with your ESP32-CAM snapshot URL
  //   const filename = `esp32-snapshot-${Date.now()}.jpg`;

  //   saveAs(url, filename);
  // };

  const esp32Ip = "192.168.50.75";
  const [imgSrc, setImgSrc] = useState(null);

  const handleTakePicture = async () => {
    saveAs("http://192.168.50.75/1024x768.jpg", `esp32-snapshot`);
    setImgSrc("http://192.168.50.75/1024x768.jpg")
  };
  

  const handleCapture = () => {
    setCapturedImage("/placeholder.png");
    setUploadedImage(null); // clear upload if using placeholder
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
      // ✅ this must go to /api/chatgpt-image
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

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>🕵️ Operator Dashboard</h1>

      {/* 🖼 Upload Image */}
      <div>
        <input type="file" accept="image/*" onChange={handleFileUpload} />
      </div>

      {/* 📸 Capture Image */}
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <button onClick={handleCapture}>📸 Use Placeholder</button>
      </div>

      {/*Test Cam stuff*/}
      <div>
        <button onClick={handleTakePicture}>Take Picture</button>
        {imgSrc && <img src={"http://192.168.50.75/1024x768.jpg"} alt="ESP32 Snapshot" style={{ width: "100%" }} />}
      </div>

      {/* 📷 Show Captured/Uploaded */}
      {capturedImage && (
        <div style={{ marginTop: "10px" }}>
          <img
            src={capturedImage}
            alt="Captured"
            style={{ width: "100%", borderRadius: 8, border: "1px solid #ccc" }}
          />
        </div>
      )}

      {(uploadedImage || capturedImage) && (
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button onClick={handleAnalyze}>🔍 Analyze Image</button>
        </div>
      )}

      {/* 💬 Prompt Input */}
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

      {/* 🧠 Chat History */}
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

      {/* 📡 Sensor Data */}
      <div style={{ marginTop: "2rem" }}>
        <LiveSensorData />
      </div>

      {/* ✅ Status */}
      {pictureStatus && <p style={{ color: "green" }}>{pictureStatus}</p>}
    </div>
  );
}

export default App;
