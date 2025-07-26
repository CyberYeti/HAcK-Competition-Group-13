import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import ChatGPTDecoder from "./ChatGPTDecoder"; // 👈 Import it

const socket = io("http://localhost:8000");

function App() {
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

  return (
    <div className="app" style={{ padding: "2rem" }}>
      <h1>🕵️ Operator Dashboard</h1>
      {pictureStatus && <p style={{ color: "green" }}>{pictureStatus}</p>}

      {/* 👇 Insert ChatGPT panel here */}
      <ChatGPTDecoder />
    </div>
  );
}

export default App;
