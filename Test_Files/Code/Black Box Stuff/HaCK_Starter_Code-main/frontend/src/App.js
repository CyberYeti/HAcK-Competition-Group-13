import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:8000');


function App() {
  const [inputValue, setInputValue] = useState('');
  const handleClick = () => {
    console.log("Input Value", inputValue)
    setInputValue("")
  }

  const [pictureStatus, setPictureStatus] = useState("");

  useEffect(() => {
    socket.on('connect', () => console.log('Connected:', socket.id));
    socket.on('picture_taken', data => {
      setPictureStatus(data.message);
      setTimeout(() => setPictureStatus(""), 3000); // Clear status after 3 seconds
    });
    return () => {
      socket.off('picture_taken');
    };
  }, []);

  return (
    <div className="app">
      <p>Write your code here!</p>
      <div>
        <input
          type="text"
          placeholder="Enter text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button onClick={handleClick}>
          Submit
        </button>
      </div>
    </div>
  );
}

export default App;
