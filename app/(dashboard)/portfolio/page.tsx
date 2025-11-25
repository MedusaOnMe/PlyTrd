'use client';

import { usePositions } from '@/hooks/usePositions';
import { PositionCard, PositionCardSkeleton } from '@/components/portfolio/PositionCard';
import { PnLSummary, PnLSummarySkeleton } from '@/components/portfolio/PnLSummary';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function PortfolioPage() {
  const { data, isLoading, error, refetch, isFetching } = usePositions(true);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground">
            Track your positions and performance
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* P&L Summary */}
      {isLoading ? (
        <div className="mb-8">
          <PnLSummarySkeleton />
        </div>
      ) : data?.summary ? (
        <div className="mb-8">
          <PnLSummary {...data.summary} />
        </div>
      ) : null}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-8">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load portfolio. Please try again.</span>
        </div>
      )}

      {/* Positions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Open Positions</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <PositionCardSkeleton key={i} />
            ))}
          </div>
        ) : data?.positions && data.positions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.positions.map((position) => (
              <PositionCard key={position.asset} position={position} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground">
              No open positions. Start trading to see your positions here.
            </p>
          </div>
        )}
      </div>

      {/* Recent Trades */}
      {data?.trades && data.trades.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Market</th>
                  <th className="text-left p-3 text-sm font-medium">Side</th>
                  <th className="text-right p-3 text-sm font-medium">Price</th>
                  <th className="text-right p-3 text-sm font-medium">Size</th>
                  <th className="text-right p-3 text-sm font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.trades.slice(0, 10).map((trade, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3 text-sm truncate max-w-[200px]">
                      {trade.outcome}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-sm font-medium ${
                          trade.side === 'BUY' ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {trade.side}
                      </span>
                    </td>
                    <td className="p-3 text-right text-sm font-mono">
                      {(parseFloat(trade.price) * 100).toFixed(1)}¢
                    </td>
                    <td className="p-3 text-right text-sm font-mono">
                      {parseFloat(trade.size).toFixed(0)}
                    </td>
                    <td className="p-3 text-right text-sm text-muted-foreground">
                      {new Date(trade.match_time).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
