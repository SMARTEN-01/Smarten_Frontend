
import { refreshAccessToken } from './api'; // Adjust path to your api.js

interface WaterReadingData {
  flow_rate_lph: number;
  status: string;
  timestamp: string;
  province: string;
  districts: Array<{
    district: string;
    flow_rate_lph: number;
    status: string;
  }>;
  critical_readings: Array<{
    province: string;
    district: string;
    status: string;
    waterflow: number;
  }>;
  past_hour: {
    average: number;
    status: string;
  };
  daily_average: {
    average: number;
    status: string;
  };
}

interface WebSocketConnection {
  socket: WebSocket;
  province: string;
  reconnectAttempts: number;
  isConnected: boolean;
  lastMessageTime: number;
}

class GlobalWebSocketService {
  private connections: Map<string, WebSocketConnection> = new Map();
  private subscribers: Map<string, Set<(data: WaterReadingData) => void>> = new Map();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000;
  private readonly provinces = ['Northern', 'Southern', 'Eastern', 'Western', 'Kigali'];

  constructor() {
    this.startGlobalReconnectMonitoring();
  }

  // Get access token from cookies (matching your auth system)
  private getAccessToken(): string | null {
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'accessToken') {
          return decodeURIComponent(value);
        }
      }
      return null;
    } catch (error) {
      /* console.error('Error reading cookies:', error); */
      return null;
    }
  }

  // Get token via API call when HttpOnly cookies prevent JavaScript access
  private async getTokenViaApi(): Promise<string | null> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/auth/get-ws-token/`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
      return null;
    } catch (error) {
      /* console.error('Error getting token via API:', error); */
      return null;
    }
  }

  // Wait for cookies to be available (handles timing issues)
  private async waitForToken(maxRetries = 3, delay = 500): Promise<string | null> {
    for (let i = 0; i < maxRetries; i++) {
      // First try to read from cookies
      const token = this.getAccessToken();
      if (token) return token;
      
      // If no token in cookies, try API fallback (for HttpOnly cookies)
      if (i === 1) { // Try API on second attempt
        /* console.log('Cookie not readable, trying API fallback...'); */
        const apiToken = await this.getTokenViaApi();
        if (apiToken) return apiToken;
      }
      
      if (i < maxRetries - 1) {
        /* console.log(`Waiting for accessToken... attempt ${i + 1}/${maxRetries}`); */
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return null;
  }

  // Subscribe to data for a specific province
  subscribe(province: string, callback: (data: WaterReadingData) => void): () => void {
    const normalizedProvince = province.charAt(0).toUpperCase() + province.slice(1).toLowerCase();
    if (!this.subscribers.has(normalizedProvince)) {
      this.subscribers.set(normalizedProvince, new Set());
    }

    this.subscribers.get(normalizedProvince)!.add(callback);

    // Ensure connection exists for this province
    this.ensureConnection(normalizedProvince);

    // Return unsubscribe function
    return () => {
      const provinceSubscribers = this.subscribers.get(normalizedProvince);
      if (provinceSubscribers) {
        provinceSubscribers.delete(callback);
        if (provinceSubscribers.size === 0) {
          this.closeConnection(normalizedProvince);
        }
      }
    };
  }

  // Ensure a WebSocket connection exists for the given province
  private async ensureConnection(province: string): Promise<void> {
    const normalizedProvince = province.charAt(0).toUpperCase() + province.slice(1).toLowerCase();

    if (this.connections.has(normalizedProvince)) {
      const connection = this.connections.get(normalizedProvince)!;
      if (connection.isConnected) {
        return; // Connection already exists and is active
      }
    }

    await this.createConnection(normalizedProvince);
  }

  // Create a new WebSocket connection for a province
  private async createConnection(province: string): Promise<void> {
    // Prefer cookies, fallback to query parameter if token is available
    const WS_BASE = import.meta.env.VITE_WS_BASE ;
    let wsUrl = `${WS_BASE}/ws/water-readings/${province}`;
    
    // Wait for token with retry mechanism
    const accessToken = await this.waitForToken();
    if (!accessToken) {
      /* console.log(`❌ WebSocket not started for ${province}: user not authenticated (no token)`); */
      return; // stop here
    }

    /* console.log(`✅ Token retrieved for ${province}, connecting WebSocket...`); */
    wsUrl = `${WS_BASE}/ws/water-readings/${province}?token=${encodeURIComponent(accessToken)}`;
    /* console.log(`🔗 WebSocket URL for ${province}: ${wsUrl.substring(0, 100)}...`); */

    // console.log(`🌐 Creating global WebSocket connection: ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    const connection: WebSocketConnection = {
      socket,
      province,
      reconnectAttempts: 0,
      isConnected: false,
      lastMessageTime: Date.now(),
    };

    this.connections.set(province, connection);

    socket.onopen = () => {
      /* console.log(`✅ Global WebSocket connected for ${province}: ${wsUrl.substring(0, 80)}...`); */
      connection.isConnected = true;
      connection.reconnectAttempts = 0;
    };

    socket.onmessage = (event) => {
      try {
        const data: WaterReadingData = JSON.parse(event.data);
        connection.lastMessageTime = Date.now();
        /* console.log(`📊 Received data for ${province}:`, data); */

        // Notify all subscribers for this province
        const provinceSubscribers = this.subscribers.get(province);
        if (provinceSubscribers) {
          provinceSubscribers.forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              /* console.error(`Error in WebSocket subscriber for ${province}:`, error); */
            }
          });
        }
      } catch (error) {
        /* console.error(`Error parsing WebSocket message for ${province}:`, error); */
      }
    };

    socket.onerror = (error) => {
      /* console.error(`❌ WebSocket error for ${province}:`, error); */
      connection.isConnected = false;
    };

    socket.onclose = async (event) => {
      /* console.log(`⚠️ WebSocket closed for ${province}. Code: ${event.code}, Reason: ${event.reason}`); */
      connection.isConnected = false;

      // Handle token expiration (code 4001 from backend)
      if (event.code === 4001 && event.reason.includes('expired')) {
        /* console.log('Access token expired, attempting to refresh'); */
        try {
          await refreshAccessToken();
          // console.log('Token refresh successful, retrying WebSocket connection');
          await this.createConnection(province);
          return;
        } catch (error) {
          // console.error('Token refresh failed:', error);
          window.location.href = '/login';
        }
      }

      // Attempt to reconnect if we have subscribers
      const provinceSubscribers = this.subscribers.get(province);
      if (provinceSubscribers && provinceSubscribers.size > 0) {
        this.scheduleReconnect(province);
      }
    };
  }

  // Schedule a reconnection attempt
private scheduleReconnect(province: string): void {
  const connection = this.connections.get(province);
  if (!connection) return;

  // Stop if max attempts reached
  if (connection.reconnectAttempts >= this.maxReconnectAttempts) {
    // Optionally log only in development
    if (import.meta.env.MODE === "development") {
      /* console.warn(`Max reconnect attempts reached for ${province}`); */
    }
    return;
  }

  connection.reconnectAttempts++;

  // Exponential backoff: delay grows with attempts, max 30s
  const delay = Math.min(this.reconnectDelay * connection.reconnectAttempts, 30000);

  // Schedule reconnect without spamming the console
  setTimeout(() => {
    // Only reconnect if user is authenticated
    const accessToken = this.getAccessToken();
    if (!accessToken) return;

    this.createConnection(province);
  }, delay);
}

  // Close a specific connection
  private closeConnection(province: string): void {
    const connection = this.connections.get(province);
    if (connection) {
      // console.log(`🔌 Closing WebSocket connection for ${province}`);
      connection.socket.close();
      this.connections.delete(province);
    }
  }

  // Start monitoring for stale connections and reconnect
  private startGlobalReconnectMonitoring(): void {
    this.reconnectInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      this.connections.forEach((connection, province) => {
        const timeSinceLastMessage = now - connection.lastMessageTime;

        if (timeSinceLastMessage > staleThreshold && this.subscribers.has(province)) {
          const provinceSubscribers = this.subscribers.get(province);
          if (provinceSubscribers && provinceSubscribers.size > 0) {
            // console.log(`🔄 Reconnecting stale connection for ${province}`);
            this.createConnection(province);
          }
        }
      });
    }, 15000); // Check every minute
  }

  // Get connection status for all provinces
  getConnectionStatus(): Record<string, { isConnected: boolean; lastMessageTime: number }> {
    const status: Record<string, { isConnected: boolean; lastMessageTime: number }> = {};

    this.connections.forEach((connection, province) => {
      status[province] = {
        isConnected: connection.isConnected,
        lastMessageTime: connection.lastMessageTime,
      };
    });

    return status;
  }

  // Get connection status for a specific province
  getProvinceConnectionStatus(province: string): { isConnected: boolean; lastMessageTime: number } | null {
    const connection = this.connections.get(province);
    if (!connection) return null;

    return {
      isConnected: connection.isConnected,
      lastMessageTime: connection.lastMessageTime,
    };
  }

  // Initialize connections for all provinces
  initializeAllConnections(): void {
    this.provinces.forEach(province => {
      this.ensureConnection(province);
    });
  }

  // Cleanup all connections
  destroy(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    this.connections.forEach((connection, province) => {
      connection.socket.close();
    });

    this.connections.clear();
    this.subscribers.clear();
  }
}

// Create a singleton instance
export const globalWebSocketService = new GlobalWebSocketService();

// Debug function to test cookie availability
export const debugCookieAvailability = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE}/auth/debug-cookies/`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await response.json();
    /* console.log('🔍 Cookie Debug Info:', data); */
    return data;
  } catch (error) {
    /* console.error('Debug cookie error:', error); */
    return null;
  }
};

// Initialize connections for all provinces after a short delay to ensure auth is ready
setTimeout(() => {
  globalWebSocketService.initializeAllConnections();
}, 1000); // 1 second delay
