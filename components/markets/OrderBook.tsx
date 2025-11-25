'use client';

import { OrderBook as OrderBookType, OrderBookLevel } from '@/lib/polymarket/types';
import { useMemo } from 'react';
import { useOrderBookWebSocket } from '@/lib/websocket/hooks';
import { Wifi, WifiOff, BookOpen, ArrowUpDown } from 'lucide-react';

interface OrderBookProps {
  orderBook: OrderBookType | null;
  assetId?: string;
  maxLevels?: number;
  onSelectPrice?: (price: string, side: 'BUY' | 'SELL') => void;
  enableRealtime?: boolean;
  className?: string;
}

export function OrderBook({
  orderBook: initialOrderBook,
  assetId,
  maxLevels = 10,
  onSelectPrice,
  enableRealtime = true,
  className,
}: OrderBookProps) {
  const { orderBook: wsOrderBook, isConnected } = useOrderBookWebSocket(
    enableRealtime ? assetId || null : null
  );

  const orderBook = useMemo(() => {
    if (wsOrderBook && wsOrderBook.bids.length > 0) {
      return wsOrderBook;
    }
    return initialOrderBook;
  }, [wsOrderBook, initialOrderBook]);

  const { bids, asks, maxSize, spread } = useMemo(() => {
    if (!orderBook) {
      return { bids: [], asks: [], maxSize: 0, spread: null };
    }

    // Sort bids by price descending (best/highest bids first)
    const sortedBids = [...orderBook.bids]
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      .slice(0, maxLevels);

    // Sort asks by price ascending (best/lowest asks first)
    const sortedAsks = [...orderBook.asks]
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      .slice(0, maxLevels);

    const allSizes = [...sortedBids, ...sortedAsks].map((l) => parseFloat(l.size));
    const maxSize = Math.max(...allSizes, 1);

    // Spread = best ask - best bid
    const spread =
      sortedBids.length > 0 && sortedAsks.length > 0
        ? (parseFloat(sortedAsks[0]?.price || '0') -
            parseFloat(sortedBids[0]?.price || '0')) *
          100
        : null;

    return { bids: sortedBids, asks: sortedAsks, maxSize, spread };
  }, [orderBook, maxLevels]);

  if (!orderBook || (orderBook.bids.length === 0 && orderBook.asks.length === 0)) {
    return (
      <div className={`glass rounded-xl overflow-hidden ${className || ''}`}>
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Order Book</h3>
            <p className="text-xs text-muted-foreground">Live market depth</p>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No order book data available</p>
          <p className="text-xs text-muted-foreground mt-1">
            This market may not have active limit orders
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass rounded-xl overflow-hidden flex flex-col ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Order Book</h3>
            <p className="text-xs text-muted-foreground">Live market depth</p>
          </div>
        </div>
        {enableRealtime && assetId && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isConnected
                ? 'bg-success/20 text-success'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Live
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Connecting...
              </>
            )}
          </div>
        )}
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-2 gap-4 px-4 py-2 bg-white/[0.02] text-xs text-muted-foreground uppercase tracking-wider flex-shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <span>Bid</span>
          <span className="text-right">Size</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <span>Ask</span>
          <span className="text-right">Size</span>
        </div>
      </div>

      {/* Order Book Content */}
      <div className="grid grid-cols-2 gap-4 p-4 flex-1 min-h-0 overflow-y-auto">
        {/* Bids (Buy orders) */}
        <div className="space-y-1">
          {bids.map((bid, i) => (
            <OrderBookRow
              key={`bid-${i}`}
              level={bid}
              maxSize={maxSize}
              side="BUY"
              onSelect={onSelectPrice}
              index={i}
            />
          ))}
          {bids.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-8">
              No bids
            </div>
          )}
        </div>

        {/* Asks (Sell orders) */}
        <div className="space-y-1">
          {asks.map((ask, i) => (
            <OrderBookRow
              key={`ask-${i}`}
              level={ask}
              maxSize={maxSize}
              side="SELL"
              onSelect={onSelectPrice}
              index={i}
            />
          ))}
          {asks.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-8">
              No asks
            </div>
          )}
        </div>
      </div>

      {/* Spread */}
      {spread !== null && (
        <div className="px-4 py-3 border-t border-white/5 bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpDown className="w-4 h-4" />
              <span>Spread</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-medium">
                {spread.toFixed(2)}¢
              </span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                {((spread / 100) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderBookRow({
  level,
  maxSize,
  side,
  onSelect,
  index,
}: {
  level: OrderBookLevel;
  maxSize: number;
  side: 'BUY' | 'SELL';
  onSelect?: (price: string, side: 'BUY' | 'SELL') => void;
  index: number;
}) {
  const price = parseFloat(level.price);
  const size = parseFloat(level.size);
  const percentage = (size / maxSize) * 100;

  const isBuy = side === 'BUY';

  return (
    <button
      onClick={() => onSelect?.(level.price, side)}
      className="relative w-full grid grid-cols-2 gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-white/5 transition-all cursor-pointer group"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Background bar */}
      <div
        className={`absolute inset-0 rounded-lg transition-all group-hover:opacity-80 ${
          isBuy ? 'bg-success/10' : 'bg-destructive/10'
        }`}
        style={{
          width: `${percentage}%`,
          [isBuy ? 'right' : 'left']: 0,
          [isBuy ? 'left' : 'right']: 'auto',
        }}
      />

      {/* Content */}
      <span
        className={`relative font-mono font-medium transition-colors ${
          isBuy
            ? 'text-success group-hover:text-success'
            : 'text-destructive group-hover:text-destructive'
        }`}
      >
        {(price * 100).toFixed(2)}¢
      </span>
      <span className="relative text-right font-mono text-muted-foreground group-hover:text-foreground transition-colors">
        {size >= 1000 ? `${(size / 1000).toFixed(1)}K` : size.toFixed(0)}
      </span>
    </button>
  );
}
