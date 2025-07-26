import { useEffect, useState } from "react";
import io from "socket.io-client";

// ✅ connect to backend
const socket = io("http://localhost:8000");

export default function LiveSensor() {
  const [temp, setTemp] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [light, setLight] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
    });

    socket.on("temp", (val) => {
      console.log("🌡️ Temp received:", val);
      setTemp(val);
    });

    socket.on("humidity", (val) => {
      console.log("💧 Humidity received:", val);
      setHumidity(val);
    });

    socket.on("light", (val) => {
      console.log("💡 Light received:", val);
      setLight(val);
    });

    socket.on("ultrasonic", (val) => {
      console.log("📏 Distance received:", val);
      setDistance(val);
    });

    return () => {
      socket.off("temp");
      socket.off("humidity");
      socket.off("light");
      socket.off("ultrasonic");
    };
  }, []);

  return (
    <div
      style={{
        padding: "1rem",
        border: "2px solid #ccc",
        borderRadius: "10px",
        marginTop: "2rem",
        width: "300px",
      }}
    >
      <h2>📡 Live Sensor Data</h2>
      <p>
        <strong>🌡️ Temp:</strong> {temp ?? "..."} °F
      </p>
      <p>
        <strong>💧 Humidity:</strong> {humidity ?? "..."} %
      </p>
      <p>
        <strong>💡 Light:</strong> {light ?? "..."} lm
      </p>
      <p>
        <strong>📏 Distance:</strong> {distance ?? "..."} cm
      </p>
    </div>
  );
}
