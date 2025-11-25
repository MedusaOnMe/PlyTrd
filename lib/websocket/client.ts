// WebSocket client for real-time Polymarket updates

export type WebSocketMessageType =
  | 'price_change'
  | 'book'
  | 'trade'
  | 'order'
  | 'tick_size_change';

export interface WebSocketMessage {
  event_type: WebSocketMessageType;
  market?: string;
  asset_id?: string;
  price?: string;
  timestamp?: string;
  hash?: string;
  [key: string]: unknown;
}

export interface BookMessage {
  event_type: 'book';
  asset_id: string;
  market: string;
  timestamp: string;
  hash: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}

export interface PriceChangeMessage {
  event_type: 'price_change';
  asset_id: string;
  market: string;
  price: string;
  timestamp: string;
}

export interface TradeMessage {
  event_type: 'trade';
  asset_id: string;
  market: string;
  price: string;
  size: string;
  side: 'BUY' | 'SELL';
  timestamp: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

const WS_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/market';

export class PolymarketWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscriptions: Set<string> = new Set();
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
        const checkInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Resubscribe to all markets
          this.subscriptions.forEach((assetId) => {
            this.sendSubscription(assetId);
          });

          // Start ping interval to keep connection alive
          this.startPingInterval();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const messages = JSON.parse(event.data);
            const messageArray = Array.isArray(messages) ? messages : [messages];

            messageArray.forEach((message: WebSocketMessage) => {
              this.handleMessage(message);
            });
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.isConnecting = false;
          this.stopPingInterval();
          this.attemptReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private startPingInterval() {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send ping to keep connection alive
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const assetId = message.asset_id;
    if (!assetId) return;

    // Call handlers for this specific asset
    const assetHandlers = this.handlers.get(assetId);
    if (assetHandlers) {
      assetHandlers.forEach((handler) => handler(message));
    }

    // Call global handlers (subscribed to '*')
    const globalHandlers = this.handlers.get('*');
    if (globalHandlers) {
      globalHandlers.forEach((handler) => handler(message));
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  private sendSubscription(assetId: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    const subscribeMsg = {
      type: 'Market',
      assets_ids: [assetId],
    };

    this.ws.send(JSON.stringify(subscribeMsg));
  }

  subscribe(assetId: string, handler: MessageHandler) {
    // Add to subscriptions set
    this.subscriptions.add(assetId);

    // Add handler
    if (!this.handlers.has(assetId)) {
      this.handlers.set(assetId, new Set());
    }
    this.handlers.get(assetId)!.add(handler);

    // Send subscription if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(assetId);
    } else {
      // Connect if not connected
      this.connect().catch(console.error);
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(assetId, handler);
    };
  }

  subscribeToAll(handler: MessageHandler) {
    if (!this.handlers.has('*')) {
      this.handlers.set('*', new Set());
    }
    this.handlers.get('*')!.add(handler);

    return () => {
      this.handlers.get('*')?.delete(handler);
    };
  }

  unsubscribe(assetId: string, handler: MessageHandler) {
    const handlers = this.handlers.get(assetId);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(assetId);
        this.subscriptions.delete(assetId);
      }
    }
  }

  disconnect() {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.handlers.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsInstance: PolymarketWebSocket | null = null;

export function getWebSocketClient(): PolymarketWebSocket {
  if (!wsInstance) {
    wsInstance = new PolymarketWebSocket();
  }
  return wsInstance;
}
