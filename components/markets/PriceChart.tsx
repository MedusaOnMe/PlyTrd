'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2, TrendingUp, TrendingDown, LineChart } from 'lucide-react';
import { useState } from 'react';

interface PriceChartProps {
  tokenId: string;
  outcome?: string;
  className?: string;
}

type Interval = '1h' | '6h' | '1d' | '1w' | 'max';

const INTERVALS: { value: Interval; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '6h', label: '6H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: 'max', label: 'All' },
];

interface PricePoint {
  t: number;
  p: number;
}

export function PriceChart({ tokenId, outcome, className }: PriceChartProps) {
  const [interval, setInterval] = useState<Interval>('1w');

  const { data, isLoading, error } = useQuery({
    queryKey: ['priceHistory', tokenId, interval],
    queryFn: async () => {
      const response = await fetch(
        `/api/prices/history?tokenId=${tokenId}&interval=${interval}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch price history');
      }
      const json = await response.json();
      return json.history as PricePoint[];
    },
    enabled: Boolean(tokenId),
    staleTime: 60000,
  });

  const chartData =
    data?.map((point) => ({
      time: point.t * 1000,
      price: point.p * 100,
    })) || [];

  const priceChange =
    chartData.length >= 2
      ? chartData[chartData.length - 1].price - chartData[0].price
      : 0;
  const isPositive = priceChange >= 0;
  const percentChange =
    chartData.length >= 2 && chartData[0].price > 0
      ? (priceChange / chartData[0].price) * 100
      : 0;

  const currentPrice =
    chartData.length > 0 ? chartData[chartData.length - 1].price : null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (interval === '1h' || interval === '6h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (interval === '1d') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (interval === '1w') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  };

  return (
    <div className={`glass rounded-xl overflow-hidden flex flex-col ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center">
            <LineChart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Price History</h3>
            {outcome && (
              <span className="text-xs text-muted-foreground">{outcome}</span>
            )}
          </div>
        </div>

        {/* Interval Selector */}
        <div className="flex gap-1 p-1 rounded-lg bg-white/5">
          {INTERVALS.map((int) => (
            <button
              key={int.value}
              onClick={() => setInterval(int.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                interval === int.value
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {int.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Stats */}
      {!isLoading && !error && chartData.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] flex-shrink-0">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Current Price
            </p>
            <p className="text-2xl font-bold">{currentPrice?.toFixed(1)}¢</p>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              isPositive ? 'bg-success/10' : 'bg-destructive/10'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
            <div className="text-right">
              <p
                className={`font-bold ${
                  isPositive ? 'text-success' : 'text-destructive'
                }`}
              >
                {isPositive ? '+' : ''}
                {priceChange.toFixed(1)}¢
              </p>
              <p
                className={`text-xs ${
                  isPositive ? 'text-success/80' : 'text-destructive/80'
                }`}
              >
                {isPositive ? '+' : ''}
                {percentChange.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[200px] gap-3">
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="absolute inset-0 blur-lg bg-primary/30 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading chart data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[200px] gap-3">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <LineChart className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-muted-foreground">Failed to load price history</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && chartData.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[200px] gap-3">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <LineChart className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No price history available</p>
          <p className="text-xs text-muted-foreground">
            Price data will appear once trading begins
          </p>
        </div>
      )}

      {/* Chart */}
      {!isLoading && !error && chartData.length > 0 && (
        <div className="flex-1 min-h-0 p-4 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradientPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="priceGradientNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(value) => `${value.toFixed(0)}¢`}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass rounded-lg p-3 shadow-xl border border-white/10">
                        <p className="text-xs text-muted-foreground mb-1">
                          {new Date(data.time).toLocaleString()}
                        </p>
                        <p className="text-lg font-bold">
                          {data.price.toFixed(1)}¢
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={
                  isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'
                }
                strokeWidth={2}
                fill={
                  isPositive
                    ? 'url(#priceGradientPositive)'
                    : 'url(#priceGradientNegative)'
                }
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
