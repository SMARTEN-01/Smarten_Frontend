
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

  // Get access token from localStorage (fallback if cookies fail)
  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken') || null;
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
    const accessToken = this.getAccessToken();
    if (accessToken) {
      wsUrl = `${WS_BASE}/ws/water-readings/${province}?token=${encodeURIComponent(accessToken)}`;
      // console.log(`Using query parameter for token: ${accessToken.slice(0, 10)}...`);
    } else {
      // console.log(`Relying on HTTP-only cookie for ${wsUrl}`);
    }

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
      // console.log(`✅ Global WebSocket connected: ${wsUrl}`);
      connection.isConnected = true;
      connection.reconnectAttempts = 0;
    };

    socket.onmessage = (event) => {
      try {
        const data: WaterReadingData = JSON.parse(event.data);
        connection.lastMessageTime = Date.now();

        // Notify all subscribers for this province
        const provinceSubscribers = this.subscribers.get(province);
        if (provinceSubscribers) {
          provinceSubscribers.forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              // console.error(`Error in WebSocket subscriber for ${province}:`, error);
            }
          });
        }
      } catch (error) {
        // console.error(`Error parsing WebSocket message for ${province}:`, error);
      }
    };

    socket.onerror = (error) => {
      // console.error(`❌ Global WebSocket error for ${province}:`, error);
      connection.isConnected = false;
    };

    socket.onclose = async (event) => {
      // console.log(`⚠️ Global WebSocket closed for ${province}: Code ${event.code}, Reason: ${event.reason}`);
      connection.isConnected = false;

      // Handle token expiration (code 4001 from backend)
      if (event.code === 4001 && event.reason.includes('expired')) {
        console.log('Access token expired, attempting to refresh');
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

    if (connection.reconnectAttempts >= this.maxReconnectAttempts) {
      // console.error(`Max reconnect attempts reached for ${province}`);
      return;
    }

    connection.reconnectAttempts++;
    const delay = this.reconnectDelay * connection.reconnectAttempts;

    // console.log(`🔄 Scheduling reconnect for ${province} in ${delay}ms (attempt ${connection.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
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

// Initialize connections for all provinces on service creation
globalWebSocketService.initializeAllConnections();
