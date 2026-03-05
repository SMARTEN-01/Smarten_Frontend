import { useEffect, useState, useRef } from "react";

export const useLeakAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 5000; // 5 seconds

  const connectWebSocket = () => {
    const WS_BASE = import.meta.env.VITE_WS_BASE ;
    const socket = new WebSocket(`${WS_BASE}/ws/leak-alerts/`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log(`✅ WebSocket connected: ${WS_BASE}/ws/leak-alerts/`);
      reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "potential_leak") {
          setAlerts((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log(`⚠️ WebSocket closed: ${WS_BASE}/ws/leak-alerts/`);
      if (reconnectAttempts.current < maxReconnectAttempts) {
        setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts.current + 1}/${maxReconnectAttempts})...`);
          reconnectAttempts.current += 1;
          connectWebSocket();
        }, reconnectInterval);
      } else {
        console.error("Max reconnect attempts reached. Please check the server.");
      }
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        console.log("WebSocket connection closed on component unmount");
      }
    };
  }, []);

  return alerts;
};