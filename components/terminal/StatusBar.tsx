'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Clock, Keyboard, Zap } from 'lucide-react';
import { getWebSocketClient } from '@/lib/websocket/client';

export function StatusBar() {
  const [time, setTime] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Update time every second
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Check WebSocket connection status
    const checkConnection = setInterval(() => {
      const client = getWebSocketClient();
      setIsConnected(client.isConnected());
    }, 1000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(checkConnection);
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-6 bg-black/60 border-t border-white/5 flex items-center justify-between px-4 text-[10px] font-mono z-50">
      {/* Left side - Connection status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <div className="status-dot connected" />
              <span className="text-success">LIVE</span>
            </>
          ) : (
            <>
              <div className="status-dot disconnected" />
              <span className="text-destructive">OFFLINE</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Zap className="w-3 h-3" />
          <span>Polymarket CLOB</span>
        </div>
      </div>

      {/* Center - Keyboard shortcuts hint */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="flex items-center gap-1">
          <kbd className="kbd">/</kbd>
          <span>Search</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="kbd">B</kbd>
          <span>Buy</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="kbd">S</kbd>
          <span>Sell</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="kbd">W</kbd>
          <span>Watchlist</span>
        </div>
      </div>

      {/* Right side - Time */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{time || '--:--:--'}</span>
        </div>
        <span className="text-primary font-bold">POLYTERM</span>
      </div>
    </div>
  );
}
