'use client';

import { useWatchlistStore } from '@/lib/store';
import { useMultiplePriceWebSocket } from '@/lib/websocket/hooks';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';

interface TickerProps {
  className?: string;
}

export function Ticker({ className }: TickerProps) {
  const { items } = useWatchlistStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration - avoid SSR mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get live prices for all watchlist items
  const tokenIds = useMemo(() => items.map((item) => item.tokenId), [items]);
  const livePrices = useMultiplePriceWebSocket(tokenIds);

  // Don't render until hydrated to avoid mismatch
  if (!isHydrated) {
    return (
      <div className={`bg-black/40 border-b border-white/5 h-9 ${className || ''}`} />
    );
  }

  if (items.length === 0) {
    return (
      <div className={`bg-black/40 border-b border-white/5 ${className || ''}`}>
        <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs text-muted-foreground">
          <Star className="w-3 h-3" />
          <span>Add markets to your watchlist to see them here</span>
          <Link href="/markets" className="text-primary hover:underline ml-2">
            Browse Markets
          </Link>
        </div>
      </div>
    );
  }

  // Only duplicate items for animation if we have more than 1 item
  // For single items, just show them without animation
  const shouldAnimate = items.length > 1;
  const displayItems = shouldAnimate ? [...items, ...items] : items;

  return (
    <div className={`bg-black/40 border-b border-white/5 overflow-hidden ${className || ''}`}>
      <div className={`flex items-center ${shouldAnimate ? 'animate-ticker' : 'justify-center'}`}>
        {displayItems.map((item, index) => (
          <TickerItem
            key={`${item.slug}-${index}`}
            item={item}
            livePrice={livePrices[item.tokenId]}
          />
        ))}
      </div>
    </div>
  );
}

interface TickerItemProps {
  item: {
    slug: string;
    question: string;
    tokenId: string;
    outcome: string;
    initialPrice?: string;
  };
  livePrice?: string;
}

function TickerItem({ item, livePrice }: TickerItemProps) {
  // Use live price if available, otherwise fall back to initial price from when added
  const priceValue = livePrice || item.initialPrice;
  const price = priceValue ? parseFloat(priceValue) * 100 : null;

  // Calculate change from initial price
  const initialPriceNum = item.initialPrice ? parseFloat(item.initialPrice) * 100 : null;
  const change = price !== null && initialPriceNum !== null ? price - initialPriceNum : null;
  const changePercent = change !== null && initialPriceNum !== null && initialPriceNum > 0
    ? (change / initialPriceNum) * 100
    : null;

  // Truncate question for ticker display
  const shortQuestion = item.question.length > 30
    ? item.question.substring(0, 30) + '...'
    : item.question;

  return (
    <Link
      href={`/market/${item.slug}`}
      className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors border-r border-white/5 whitespace-nowrap group"
    >
      <Star className="w-3 h-3 text-yellow-500 flex-shrink-0 fill-yellow-500" />
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors max-w-[200px] truncate">
        {shortQuestion}
      </span>
      {price !== null ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold text-success">
            {price.toFixed(1)}¢
          </span>
          {changePercent !== null && (
            <span className={`text-[10px] font-mono ${change! >= 0 ? 'text-success' : 'text-destructive'}`}>
              {change! >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
            </span>
          )}
        </div>
      ) : (
        <span className="text-sm font-mono text-muted-foreground animate-pulse">--¢</span>
      )}
    </Link>
  );
}
