import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:8000');

function App() {
  const [pictureStatus, setPictureStatus] = useState("");

  const [opMessage, setOpMessage] = useState(0);
  const [pi1, setpi1] = useState(0);

  const handleChange = (e) => {
    setOpMessage(e.target.value);
  };


  useEffect(() => {
    socket.on('connect', () => console.log('Connected:', socket.id));
    socket.on('picture_taken', data => {
      setPictureStatus(data.message);
      setTimeout(() => setPictureStatus(""), 3000); // Clear status after 3 seconds
    });

    socket.on("pi1", (val) => {
      setpi1(val)
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
          value={opMessage}
          onChange={handleChange}
          placeholder="Enter text here">
        </input>
        <button type="button" onClick={testSubmit}>
          Press To Send Message
        </button> 
      </div>
    </div>


  );
}

export default App;
