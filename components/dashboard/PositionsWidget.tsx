'use client';

import { useAuthStore } from '@/lib/store';
import { Wallet, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function PositionsWidget() {
  const { user, walletAddress } = useAuthStore();

  // TODO: Fetch actual positions from the API
  // For now, show a placeholder

  if (!user) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5 text-primary" />
            <span className="panel-title">My Positions</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Wallet className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">Connect wallet to view positions</p>
          <button className="mt-2 text-xs text-primary hover:underline">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Mock positions for demo
  const positions = [
    { market: 'Trump wins 2024', slug: 'trump-2024', outcome: 'Yes', shares: 150, avgPrice: 0.65, currentPrice: 0.82, pnl: 25.50 },
    { market: 'BTC over $100K by EOY', slug: 'btc-100k', outcome: 'Yes', shares: 200, avgPrice: 0.32, currentPrice: 0.34, pnl: 4.00 },
    { market: 'Fed cuts rates Dec', slug: 'fed-cuts', outcome: 'No', shares: 100, avgPrice: 0.45, currentPrice: 0.38, pnl: -7.00 },
  ];

  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const isPositive = totalPnL >= 0;

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5 text-primary" />
          <span className="panel-title">My Positions</span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-mono ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{totalPnL.toFixed(2)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-white/5">
          {positions.map((position, index) => {
            const pnlPercent = ((position.currentPrice - position.avgPrice) / position.avgPrice) * 100;
            const isWinning = position.pnl >= 0;

            return (
              <Link
                key={index}
                href={`/market/${position.slug}`}
                className="data-row group"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate group-hover:text-primary transition-colors">
                    {position.market}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {position.shares} {position.outcome} @ {(position.avgPrice * 100).toFixed(0)}¢
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className={`text-sm font-mono font-bold ${isWinning ? 'text-success' : 'text-destructive'}`}>
                    {isWinning ? '+' : ''}{position.pnl.toFixed(2)}
                  </span>
                  <span className={`text-[10px] ${isWinning ? 'text-success/70' : 'text-destructive/70'}`}>
                    {isWinning ? '+' : ''}{pnlPercent.toFixed(1)}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/5 p-2">
        <Link
          href="/portfolio"
          className="text-[10px] text-primary hover:underline flex items-center justify-center"
        >
          View all positions →
        </Link>
      </div>
    </div>
  );
}
