// frontend/src/ChatGPTDecoder.js
import { useState } from "react";

export default function ChatGPTDecoder() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const handleAsk = async () => {
    console.log("Prompt sent:", input);

    try {
      const res = await fetch("http://localhost:8000/api/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      // Check if the response is valid JSON
      const contentType = res.headers.get("Content-Type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          `❌ Invalid response from server: ${text.slice(0, 100)}...`
        );
      }

      const data = await res.json();
      console.log("GPT Response:", data);

      setResponse(data.response);

      // Optional: Speak it aloud
      if (data.response) {
        const msg = new SpeechSynthesisUtterance(data.response);
        window.speechSynthesis.speak(msg);
      }
    } catch (err) {
      console.error("Fetch/GPT error:", err.message);
      setResponse("❌ Error: " + err.message);
    }
  };

  return (
    <div
      style={{ padding: "1rem", border: "1px solid gray", marginTop: "1rem" }}
    >
      <h2>💬 ChatGPT Decoder</h2>
      <textarea
        rows="4"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a clue to decode..."
        style={{ width: "100%" }}
      />
      <br />
      <button onClick={handleAsk}>Ask ChatGPT</button>
      <div style={{ marginTop: "1rem" }}>
        <strong>Response:</strong>
        <p>{response}</p>
      </div>
    </div>
  );
}
