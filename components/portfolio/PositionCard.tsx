'use client';

import Link from 'next/link';
import { Position } from '@/lib/polymarket/types';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

interface PositionCardProps {
  position: Position;
}

export function PositionCard({ position }: PositionCardProps) {
  const pnl = parseFloat(position.cash_pnl || '0');
  const pnlPercent = parseFloat(position.percent_pnl || '0');
  const currentValue = parseFloat(position.current_value || '0');
  const size = parseFloat(position.size || '0');
  const avgPrice = parseFloat(position.avg_price || '0');
  const isProfit = pnl >= 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{position.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`
              text-sm font-medium px-2 py-0.5 rounded
              ${position.outcome === 'Yes' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}
            `}
            >
              {position.outcome}
            </span>
            <span className="text-sm text-muted-foreground">
              {size.toFixed(0)} shares @ {(avgPrice * 100).toFixed(1)}¢
            </span>
          </div>
        </div>
        <Link
          href={`/market/${position.market_slug}`}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Current Value</div>
          <div className="text-lg font-mono font-medium">
            ${currentValue.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">P&L</div>
          <div
            className={`text-lg font-mono font-medium flex items-center gap-1 ${
              isProfit ? 'text-success' : 'text-destructive'
            }`}
          >
            {isProfit ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {isProfit ? '+' : ''}${pnl.toFixed(2)}
            <span className="text-sm">({pnlPercent.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {position.redeemable && (
        <div className="mt-3 pt-3 border-t border-border">
          <span className="text-sm text-success">
            Redeemable - Market has resolved
          </span>
        </div>
      )}
    </div>
  );
}

export function PositionCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 bg-muted rounded w-3/4 mb-2" />
          <div className="flex items-center gap-2">
            <div className="h-6 bg-muted rounded w-16" />
            <div className="h-4 bg-muted rounded w-24" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="h-4 bg-muted rounded w-20 mb-1" />
          <div className="h-6 bg-muted rounded w-16" />
        </div>
        <div>
          <div className="h-4 bg-muted rounded w-12 mb-1" />
          <div className="h-6 bg-muted rounded w-20" />
        </div>
      </div>
    </div>
  );
}
