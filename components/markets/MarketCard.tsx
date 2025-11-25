'use client';

import Link from 'next/link';
import Image from 'next/image';
import { GammaMarket } from '@/lib/polymarket/types';
import { TrendingUp, Clock, Zap, ChevronRight } from 'lucide-react';

interface MarketCardProps {
  market: GammaMarket & {
    event_slug?: string;
    event_title?: string;
    event_icon?: string;
  };
}

export function MarketCard({ market }: MarketCardProps) {
  const yesToken = market.tokens?.find((t) => t.outcome === 'Yes');
  const noToken = market.tokens?.find((t) => t.outcome === 'No');

  let yesPrice = 50;
  let noPrice = 50;

  if (yesToken?.price) {
    yesPrice = Math.round(yesToken.price * 100);
  } else if (market.outcomePrices) {
    try {
      const prices = JSON.parse(market.outcomePrices);
      if (Array.isArray(prices) && prices.length >= 2) {
        yesPrice = Math.round(parseFloat(prices[0]) * 100);
        noPrice = Math.round(parseFloat(prices[1]) * 100);
      }
    } catch {
      // Use defaults
    }
  }

  if (noToken?.price) {
    noPrice = Math.round(noToken.price * 100);
  } else {
    noPrice = 100 - yesPrice;
  }

  const endDate = market.end_date_iso
    ? new Date(market.end_date_iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const volume = market.volume
    ? parseFloat(market.volume) >= 1000000
      ? `$${(parseFloat(market.volume) / 1000000).toFixed(1)}M`
      : parseFloat(market.volume) >= 1000
      ? `$${(parseFloat(market.volume) / 1000).toFixed(0)}K`
      : `$${parseFloat(market.volume).toFixed(0)}`
    : null;

  const slug = market.event_slug || market.market_slug;

  if (!slug) {
    return null;
  }

  const marketId = market.condition_id || market.id;
  const href = marketId ? `/market/${slug}?m=${marketId}` : `/market/${slug}`;

  // Determine if Yes is winning
  const isYesWinning = yesPrice > 50;

  return (
    <Link href={href} className="group block">
      <div className="relative h-full glass glass-hover rounded-xl overflow-hidden transition-all duration-300 group-hover:glow-sm group-hover:scale-[1.02]">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            {(market.icon || market.event_icon) && (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-transparent flex-shrink-0 ring-1 ring-white/10">
                <Image
                  src={market.icon || market.event_icon || ''}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {market.question}
              </h3>
              {market.category && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                  <Zap className="w-3 h-3" />
                  {market.category}
                </span>
              )}
            </div>
          </div>

          {/* Probability Bar */}
          <div className="relative mb-4">
            <div className="flex justify-between text-xs font-medium mb-2">
              <span className="text-success">Yes {yesPrice}%</span>
              <span className="text-destructive">No {noPrice}%</span>
            </div>
            <div className="relative h-2 rounded-full overflow-hidden bg-destructive/20">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-success to-success/80 rounded-full transition-all duration-500"
                style={{ width: `${yesPrice}%` }}
              />
              {/* Glow effect at the boundary */}
              <div
                className="absolute inset-y-0 w-1 bg-white/50 blur-sm transition-all duration-500"
                style={{ left: `calc(${yesPrice}% - 2px)` }}
              />
            </div>
          </div>

          {/* Price Display */}
          <div className="flex gap-3 mb-4">
            <div className={`flex-1 rounded-lg p-3 transition-all ${isYesWinning ? 'bg-success/15 ring-1 ring-success/30' : 'bg-success/10'}`}>
              <div className="text-[10px] uppercase tracking-wider text-success/80 mb-1">Buy Yes</div>
              <div className="text-xl font-bold text-success">{yesPrice}¢</div>
            </div>
            <div className={`flex-1 rounded-lg p-3 transition-all ${!isYesWinning ? 'bg-destructive/15 ring-1 ring-destructive/30' : 'bg-destructive/10'}`}>
              <div className="text-[10px] uppercase tracking-wider text-destructive/80 mb-1">Buy No</div>
              <div className="text-xl font-bold text-destructive">{noPrice}¢</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {volume && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium">{volume}</span>
                </div>
              )}
              {endDate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{endDate}</span>
                </div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="glass rounded-xl p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-muted rounded-xl shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded shimmer w-3/4" />
          <div className="h-3 bg-muted rounded shimmer w-1/4" />
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full mb-4 shimmer" />
      <div className="flex gap-3 mb-4">
        <div className="flex-1 h-16 bg-muted rounded-lg shimmer" />
        <div className="flex-1 h-16 bg-muted rounded-lg shimmer" />
      </div>
      <div className="flex justify-between pt-3 border-t border-white/5">
        <div className="h-3 bg-muted rounded shimmer w-1/4" />
        <div className="h-3 bg-muted rounded shimmer w-1/6" />
      </div>
    </div>
  );
}
