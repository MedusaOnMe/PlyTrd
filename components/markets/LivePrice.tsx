'use client';

import { usePriceWebSocket } from '@/lib/websocket/hooks';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface LivePriceProps {
  assetId: string;
  initialPrice?: number;
  className?: string;
  showIndicator?: boolean;
}

export function LivePrice({
  assetId,
  initialPrice,
  className = '',
  showIndicator = true,
}: LivePriceProps) {
  const { price: wsPrice, lastUpdate } = usePriceWebSocket(assetId);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);

  const currentPrice = wsPrice ? parseFloat(wsPrice) : initialPrice;
  const displayPrice = currentPrice
    ? (currentPrice * 100).toFixed(0)
    : '—';

  // Track price direction for visual indicator
  useEffect(() => {
    if (wsPrice && previousPrice !== null) {
      const newPrice = parseFloat(wsPrice);
      if (newPrice > previousPrice) {
        setPriceDirection('up');
      } else if (newPrice < previousPrice) {
        setPriceDirection('down');
      }
      // Clear direction after animation
      const timeout = setTimeout(() => setPriceDirection(null), 1000);
      return () => clearTimeout(timeout);
    }
    if (wsPrice) {
      setPreviousPrice(parseFloat(wsPrice));
    }
  }, [wsPrice]);

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-mono transition-colors duration-200
        ${priceDirection === 'up' ? 'text-success' : ''}
        ${priceDirection === 'down' ? 'text-destructive' : ''}
        ${className}
      `}
    >
      {displayPrice}¢
      {showIndicator && priceDirection && (
        <span className="animate-pulse">
          {priceDirection === 'up' ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
        </span>
      )}
    </span>
  );
}
