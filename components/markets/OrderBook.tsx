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
  compact?: boolean; // true = horizontal layout for bottom row, false = vertical for top row
}

export function OrderBook({
  orderBook: initialOrderBook,
  assetId,
  maxLevels: maxLevelsProp,
  onSelectPrice,
  enableRealtime = true,
  className,
  compact = false,
}: OrderBookProps) {
  // Use fewer levels in compact mode
  const maxLevels = maxLevelsProp ?? (compact ? 6 : 10);
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

  // Empty state
  if (!orderBook || (orderBook.bids.length === 0 && orderBook.asks.length === 0)) {
    return (
      <div className={`glass rounded-xl overflow-hidden h-full flex ${compact ? 'flex-row items-center' : 'flex-col'} ${className || ''}`}>
        <div className={`flex items-center gap-2 ${compact ? 'p-2 border-r' : 'p-3 border-b'} border-white/5`}>
          <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center`}>
            <BookOpen className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-primary`} />
          </div>
          <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold`}>Order Book</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <p className="text-xs text-muted-foreground">No order book data</p>
        </div>
      </div>
    );
  }

  // Compact horizontal layout for bottom row
  if (compact) {
    return (
      <div className={`glass rounded-xl overflow-hidden flex flex-row h-full ${className || ''}`}>
        {/* Header - vertical strip on left */}
        <div className="flex flex-col items-center justify-center px-2 py-1 border-r border-white/5 bg-white/[0.02]">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center mb-1">
            <BookOpen className="w-3 h-3 text-primary" />
          </div>
          {enableRealtime && assetId && (
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-muted'}`} />
          )}
        </div>

        {/* Bids section */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
          <div className="px-2 py-1 bg-white/[0.02] text-[9px] text-muted-foreground uppercase tracking-wider flex justify-between">
            <span className="text-success">Bids</span>
            <span>Size</span>
          </div>
          <div className="flex-1 overflow-y-auto px-1 py-1">
            {bids.map((bid, i) => (
              <OrderBookRowCompact key={`bid-${i}`} level={bid} maxSize={maxSize} side="BUY" onSelect={onSelectPrice} />
            ))}
          </div>
        </div>

        {/* Spread indicator - center */}
        {spread !== null && (
          <div className="flex flex-col items-center justify-center px-2 bg-white/[0.02]">
            <ArrowUpDown className="w-3 h-3 text-muted-foreground mb-0.5" />
            <span className="text-[10px] font-mono font-medium">{spread.toFixed(1)}¢</span>
          </div>
        )}

        {/* Asks section */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-2 py-1 bg-white/[0.02] text-[9px] text-muted-foreground uppercase tracking-wider flex justify-between">
            <span className="text-destructive">Asks</span>
            <span>Size</span>
          </div>
          <div className="flex-1 overflow-y-auto px-1 py-1">
            {asks.map((ask, i) => (
              <OrderBookRowCompact key={`ask-${i}`} level={ask} maxSize={maxSize} side="SELL" onSelect={onSelectPrice} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Full vertical layout for top row
  return (
    <div className={`glass rounded-xl overflow-hidden flex flex-col h-full ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold">Order Book</h3>
        </div>
        {enableRealtime && assetId && (
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
              isConnected
                ? 'bg-success/20 text-success'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isConnected ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                </span>
                Live
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                ...
              </>
            )}
          </div>
        )}
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-2 gap-2 px-3 py-1.5 bg-white/[0.02] text-[10px] text-muted-foreground uppercase tracking-wider flex-shrink-0">
        <div className="grid grid-cols-2 gap-1">
          <span>Bid</span>
          <span className="text-right">Size</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <span>Ask</span>
          <span className="text-right">Size</span>
        </div>
      </div>

      {/* Order Book Content */}
      <div className="grid grid-cols-2 gap-2 px-3 py-2 flex-1 min-h-0 overflow-y-auto">
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
        <div className="px-3 py-2 border-t border-white/5 bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ArrowUpDown className="w-3 h-3" />
              <span>Spread</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">{spread.toFixed(2)}¢</span>
              <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
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
      className="relative w-full grid grid-cols-2 gap-1 text-[11px] py-1 px-1.5 rounded hover:bg-white/5 transition-all cursor-pointer group"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Background bar */}
      <div
        className={`absolute inset-0 rounded transition-all group-hover:opacity-80 ${
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
        {(price * 100).toFixed(1)}¢
      </span>
      <span className="relative text-right font-mono text-muted-foreground group-hover:text-foreground transition-colors">
        {size >= 1000 ? `${(size / 1000).toFixed(1)}K` : size.toFixed(0)}
      </span>
    </button>
  );
}

// Compact row for horizontal layout
function OrderBookRowCompact({
  level,
  maxSize,
  side,
  onSelect,
}: {
  level: OrderBookLevel;
  maxSize: number;
  side: 'BUY' | 'SELL';
  onSelect?: (price: string, side: 'BUY' | 'SELL') => void;
}) {
  const price = parseFloat(level.price);
  const size = parseFloat(level.size);
  const percentage = (size / maxSize) * 100;
  const isBuy = side === 'BUY';

  return (
    <button
      onClick={() => onSelect?.(level.price, side)}
      className="relative w-full flex justify-between text-[10px] py-0.5 px-1 rounded hover:bg-white/5 transition-all cursor-pointer group"
    >
      {/* Background bar */}
      <div
        className={`absolute inset-0 rounded transition-all group-hover:opacity-80 ${
          isBuy ? 'bg-success/10' : 'bg-destructive/10'
        }`}
        style={{
          width: `${percentage}%`,
          [isBuy ? 'right' : 'left']: 0,
          [isBuy ? 'left' : 'right']: 'auto',
        }}
      />
      <span className={`relative font-mono font-medium ${isBuy ? 'text-success' : 'text-destructive'}`}>
        {(price * 100).toFixed(1)}¢
      </span>
      <span className="relative font-mono text-muted-foreground">
        {size >= 1000 ? `${(size / 1000).toFixed(1)}K` : size.toFixed(0)}
      </span>
    </button>
  );
}
