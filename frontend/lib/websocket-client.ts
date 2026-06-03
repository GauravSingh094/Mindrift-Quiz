import { logger } from "./logger";

type WebSocketListener = (data: any) => void;

class ResilientWebSocketManager {
  private socket: WebSocket | null = null;
  private url = "";
  private listeners: Map<string, Set<WebSocketListener>> = new Map();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;

  public connect(url: string) {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.url = url;
    this.isConnecting = true;
    logger.info(`🔌 Connecting Resilient WebSocket: ${url}`);

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        logger.info(`🔌 WebSocket channel established successfully: ${this.url}`);
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const topic = payload.topic || "global";
          
          const topicListeners = this.listeners.get(topic);
          if (topicListeners) {
            topicListeners.forEach((listener) => listener(payload.data));
          }
        } catch (err) {
          logger.error("Failed to parse WebSocket message stream", err);
        }
      };

      this.socket.onerror = (error) => {
        logger.error(`🔌 WebSocket connection encountered error`, error);
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.stopHeartbeat();
        logger.warn(`🔌 WebSocket connection closed. Triggering recovery...`);
        this.handleReconnect();
      };
    } catch (err) {
      this.isConnecting = false;
      logger.error("Failed to compile WebSocket instance", err);
      this.handleReconnect();
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        // Dispatch clean ping message
        this.socket.send(JSON.stringify({ type: "PING", timestamp: Date.now() }));
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`🔌 Maximum WebSocket reconnect attempts reached. Active offline fallback preserved.`);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts); // Exponential backoff
    logger.info(`🔌 Reconnecting in ${delay.toFixed(0)}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.connectionTimeout = setTimeout(() => {
      this.connect(this.url);
    }, delay);
  }

  public subscribe(topic: string, listener: WebSocketListener) {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(listener);
    logger.info(`🔌 WebSocket subscription registered: ${topic}`);

    // Autoconnect on first listener if URL is set
    if (this.socket?.readyState !== WebSocket.OPEN && this.url) {
      this.connect(this.url);
    }
  }

  public unsubscribe(topic: string, listener: WebSocketListener) {
    const topicListeners = this.listeners.get(topic);
    if (topicListeners) {
      topicListeners.delete(listener);
      if (topicListeners.size === 0) {
        this.listeners.delete(topic);
      }
      logger.info(`🔌 WebSocket subscription revoked: ${topic}`);
    }
  }

  public disconnect() {
    this.stopHeartbeat();
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    logger.info("🔌 WebSocket connection closed explicitly by system.");
  }
}

export const wsManager = new ResilientWebSocketManager();
export default wsManager;
