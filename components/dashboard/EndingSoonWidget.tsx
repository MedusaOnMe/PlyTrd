'use client';

import { useMarkets } from '@/hooks/useMarkets';
import { Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

export function EndingSoonWidget() {
  const { data, isLoading } = useMarkets({ active: true, limit: 100 });

  const endingSoon = useMemo(() => {
    if (!data?.markets) return [];

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    return data.markets
      .filter((m) => {
        if (!m.end_date_iso) return false;
        const endDate = new Date(m.end_date_iso).getTime();
        return endDate > now && endDate - now < oneWeek;
      })
      .sort((a, b) => {
        const aDate = new Date(a.end_date_iso!).getTime();
        const bDate = new Date(b.end_date_iso!).getTime();
        return aDate - bDate;
      })
      .slice(0, 8);
  }, [data?.markets]);

  const formatTimeLeft = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-warning" />
          <span className="panel-title">Ending Soon</span>
        </div>
        <span className="text-[10px] text-muted-foreground">&lt; 7 days</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : endingSoon.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No markets ending soon</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {endingSoon.map((market, index) => {
              let yesPrice = 50;
              try {
                if (market.outcomePrices) {
                  const prices = JSON.parse(market.outcomePrices);
                  yesPrice = parseFloat(prices[0]) * 100;
                }
              } catch {}

              const timeLeft = formatTimeLeft(market.end_date_iso!);
              const isUrgent = timeLeft.includes('h') && !timeLeft.includes('d');

              return (
                <Link
                  key={market.id || market.condition_id || index}
                  href={`/market/${market.market_slug}`}
                  className="data-row group"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs truncate block group-hover:text-primary transition-colors">
                      {market.question}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[10px] font-mono ${isUrgent ? 'text-warning' : 'text-muted-foreground'}`}>
                      {timeLeft}
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
