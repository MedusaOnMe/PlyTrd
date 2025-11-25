'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import {
  getWebSocketClient,
  WebSocketMessage,
  BookMessage,
  PriceChangeMessage,
} from './client';

// Hook for subscribing to market updates
export function useMarketWebSocket(
  assetIds: string[],
  onMessage?: (message: WebSocketMessage) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<WebSocketMessage | null>(null);
  const wsClient = useRef(getWebSocketClient());

  useEffect(() => {
    const client = wsClient.current;
    const unsubscribes: (() => void)[] = [];

    const handleMessage = (message: WebSocketMessage) => {
      setLastUpdate(message);
      onMessage?.(message);
    };

    // Subscribe to each asset
    assetIds.forEach((assetId) => {
      if (assetId) {
        const unsub = client.subscribe(assetId, handleMessage);
        unsubscribes.push(unsub);
      }
    });

    // Check connection status
    const checkConnection = setInterval(() => {
      setIsConnected(client.isConnected());
    }, 1000);

    // Initial connect
    client.connect().then(() => {
      setIsConnected(true);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
      clearInterval(checkConnection);
    };
  }, [assetIds.join(','), onMessage]);

  return { isConnected, lastUpdate };
}

// Hook for real-time orderbook updates
export function useOrderBookWebSocket(assetId: string | null) {
  const [orderBook, setOrderBook] = useState<{
    bids: Array<{ price: string; size: string }>;
    asks: Array<{ price: string; size: string }>;
  } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsClient = useRef(getWebSocketClient());

  // Reset orderBook when assetId changes
  useEffect(() => {
    setOrderBook(null);
  }, [assetId]);

  useEffect(() => {
    if (!assetId) return;

    const client = wsClient.current;

    const handleMessage = (message: WebSocketMessage) => {
      if (message.event_type === 'book') {
        const bookMsg = message as unknown as BookMessage;
        setOrderBook({
          bids: bookMsg.bids || [],
          asks: bookMsg.asks || [],
        });
      }
    };

    const unsub = client.subscribe(assetId, handleMessage);

    client.connect().then(() => {
      setIsConnected(true);
    });

    return () => {
      unsub();
    };
  }, [assetId]);

  return { orderBook, isConnected };
}

// Hook for real-time price updates
export function usePriceWebSocket(assetId: string | null) {
  const [price, setPrice] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const wsClient = useRef(getWebSocketClient());

  useEffect(() => {
    if (!assetId) return;

    const client = wsClient.current;

    const handleMessage = (message: WebSocketMessage) => {
      if (message.event_type === 'price_change') {
        const priceMsg = message as unknown as PriceChangeMessage;
        setPrice(priceMsg.price);
        setLastUpdate(new Date());
      }
    };

    const unsub = client.subscribe(assetId, handleMessage);

    client.connect();

    return () => {
      unsub();
    };
  }, [assetId]);

  return { price, lastUpdate };
}

// Hook for multiple price updates (useful for market list)
export function useMultiplePriceWebSocket(assetIds: string[]) {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const wsClient = useRef(getWebSocketClient());

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.event_type === 'price_change' && message.asset_id && message.price) {
      setPrices((prev) => ({
        ...prev,
        [message.asset_id!]: message.price!,
      }));
    }
  }, []);

  useEffect(() => {
    const client = wsClient.current;
    const unsubscribes: (() => void)[] = [];

    assetIds.forEach((assetId) => {
      if (assetId) {
        const unsub = client.subscribe(assetId, handleMessage);
        unsubscribes.push(unsub);
      }
    });

    if (assetIds.length > 0) {
      client.connect();
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [assetIds.join(','), handleMessage]);

  return prices;
}
