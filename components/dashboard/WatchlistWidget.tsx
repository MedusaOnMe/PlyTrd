'use client';

import { useWatchlistStore } from '@/lib/store';
import { useMultiplePriceWebSocket } from '@/lib/websocket/hooks';
import { Star, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

export function WatchlistWidget() {
  const { items, removeFromWatchlist } = useWatchlistStore();

  const tokenIds = useMemo(() => items.map((item) => item.tokenId), [items]);
  const livePrices = useMultiplePriceWebSocket(tokenIds);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-yellow-500" />
          <span className="panel-title">Watchlist</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{items.length} items</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Star className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No markets in watchlist</p>
            <Link href="/markets" className="text-xs text-primary hover:underline mt-1">
              Browse markets
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map((item) => {
              const price = livePrices[item.tokenId]
                ? parseFloat(livePrices[item.tokenId]) * 100
                : null;

              return (
                <div key={item.slug} className="data-row group">
                  <Link
                    href={`/market/${item.slug}`}
                    className="flex-1 min-w-0 flex items-center gap-2"
                  >
                    <span className="text-xs truncate group-hover:text-primary transition-colors">
                      {item.question}
                    </span>
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {price !== null ? (
                      <span className={`text-sm font-mono font-bold ${price >= 50 ? 'text-success' : 'text-destructive'}`}>
                        {price.toFixed(1)}¢
                      </span>
                    ) : (
                      <span className="text-sm font-mono text-muted-foreground">--</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeFromWatchlist(item.slug);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
