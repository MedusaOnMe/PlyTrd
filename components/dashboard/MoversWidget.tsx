'use client';

import { useMarkets } from '@/hooks/useMarkets';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

interface MoversWidgetProps {
  type?: 'gainers' | 'losers' | 'volume';
}

export function MoversWidget({ type = 'gainers' }: MoversWidgetProps) {
  const { data, isLoading } = useMarkets({ active: true, limit: 50 });

  const movers = useMemo(() => {
    if (!data?.markets) return [];

    // For now, just sort by volume since we don't have price change data
    // In a real implementation, you'd track price changes over time
    const sorted = [...data.markets].sort((a, b) => {
      if (type === 'volume') {
        return parseFloat(b.volume || '0') - parseFloat(a.volume || '0');
      }
      // Default to volume for now
      return parseFloat(b.volume || '0') - parseFloat(a.volume || '0');
    });

    return sorted.slice(0, 8);
  }, [data?.markets, type]);

  const getTitle = () => {
    switch (type) {
      case 'gainers': return 'Top Gainers';
      case 'losers': return 'Top Losers';
      case 'volume': return 'High Volume';
      default: return 'Top Markets';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'gainers': return <TrendingUp className="w-3.5 h-3.5 text-success" />;
      case 'losers': return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
      default: return <TrendingUp className="w-3.5 h-3.5 text-primary" />;
    }
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="panel-title">{getTitle()}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {movers.map((market, index) => {
              // Get yes price from tokens
              let yesPrice = 50;
              try {
                if (market.outcomePrices) {
                  const prices = JSON.parse(market.outcomePrices);
                  yesPrice = parseFloat(prices[0]) * 100;
                }
              } catch {}

              const volume = parseFloat(market.volume || '0');
              const volumeFormatted = volume >= 1000000
                ? `$${(volume / 1000000).toFixed(1)}M`
                : volume >= 1000
                ? `$${(volume / 1000).toFixed(0)}K`
                : `$${volume.toFixed(0)}`;

              return (
                <Link
                  key={market.id || market.condition_id || index}
                  href={`/market/${market.market_slug}`}
                  className="data-row group"
                >
                  <span className="text-xs text-muted-foreground w-5">{index + 1}</span>
                  <span className="flex-1 text-xs truncate group-hover:text-primary transition-colors">
                    {market.question}
                  </span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                      {volumeFormatted}
                    </span>
                    <span className={`text-sm font-mono font-bold ${yesPrice >= 50 ? 'text-success' : 'text-destructive'}`}>
                      {yesPrice.toFixed(0)}¢
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
