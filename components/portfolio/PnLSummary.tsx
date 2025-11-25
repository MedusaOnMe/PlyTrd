'use client';

import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface PnLSummaryProps {
  totalValue: string;
  totalPnl: string;
  totalInitial: string;
  percentPnl: string;
}

export function PnLSummary({
  totalValue,
  totalPnl,
  totalInitial,
  percentPnl,
}: PnLSummaryProps) {
  const pnl = parseFloat(totalPnl);
  const pnlPct = parseFloat(percentPnl);
  const isProfit = pnl >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <DollarSign className="w-4 h-4" />
          <span className="text-sm">Portfolio Value</span>
        </div>
        <div className="text-2xl font-bold font-mono">
          ${parseFloat(totalValue).toFixed(2)}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <DollarSign className="w-4 h-4" />
          <span className="text-sm">Initial Investment</span>
        </div>
        <div className="text-2xl font-bold font-mono">
          ${parseFloat(totalInitial).toFixed(2)}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {isProfit ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-destructive" />
          )}
          <span className="text-sm">Total P&L</span>
        </div>
        <div
          className={`text-2xl font-bold font-mono ${
            isProfit ? 'text-success' : 'text-destructive'
          }`}
        >
          {isProfit ? '+' : ''}${pnl.toFixed(2)}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Percent className="w-4 h-4" />
          <span className="text-sm">Return</span>
        </div>
        <div
          className={`text-2xl font-bold font-mono ${
            isProfit ? 'text-success' : 'text-destructive'
          }`}
        >
          {isProfit ? '+' : ''}{pnlPct}%
        </div>
      </div>
    </div>
  );
}

export function PnLSummarySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-20" />
          </div>
          <div className="h-8 bg-muted rounded w-24" />
        </div>
      ))}
    </div>
  );
}
