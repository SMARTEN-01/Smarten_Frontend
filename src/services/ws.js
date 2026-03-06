export const createWebSocket = (url, onMessage) => {
    const socket = new WebSocket(url);
  
    socket.onopen = () => {
      // console.log("✅ WebSocket connected:", url);
    };
  
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };
  
    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };
  
    socket.onclose = () => {
      console.log("⚠️ WebSocket closed:", url);
    };
  
    return socket;
  };
  