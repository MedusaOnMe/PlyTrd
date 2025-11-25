'use client';

import { useState, useEffect } from 'react';
import { GammaMarket } from '@/lib/polymarket/types';
import { useCreateOrder } from '@/hooks/useOrders';
import { useAuthStore } from '@/lib/store';
import {
  Loader2,
  AlertCircle,
  Info,
  Wallet,
  TrendingUp,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface TradingPanelProps {
  market: GammaMarket;
  selectedToken?: {
    token_id: string;
    outcome: string;
    price?: number;
  };
  spread?: {
    bid: string;
    ask: string;
  };
}

export function TradingPanel({
  market,
  selectedToken,
  spread,
}: TradingPanelProps) {
  const { user, usdcBalance } = useAuthStore();
  const createOrder = useCreateOrder();

  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'GTC' | 'FOK'>('GTC');
  const [price, setPrice] = useState('');
  const [shares, setShares] = useState('');

  // Get market price from spread (ask for BUY, bid for SELL), fallback to token price
  const marketPrice = side === 'BUY'
    ? (spread?.ask ? parseFloat(spread.ask) : (selectedToken?.price ?? null))
    : (spread?.bid ? parseFloat(spread.bid) : (selectedToken?.price ?? null));

  // Auto-set price when using market orders (FOK)
  useEffect(() => {
    if (orderType === 'FOK' && marketPrice) {
      setPrice(marketPrice.toFixed(2));
    }
  }, [orderType, side, marketPrice]);

  const priceNum = parseFloat(price) || 0;
  const sharesNum = parseFloat(shares) || 0;
  const cost = side === 'BUY' ? priceNum * sharesNum : sharesNum * (1 - priceNum);
  const potentialReturn = side === 'BUY' ? sharesNum - cost : sharesNum * priceNum;
  const balanceNum = parseFloat(usdcBalance) || 0;

  const canAfford = cost <= balanceNum;
  const isValidOrder = priceNum > 0 && priceNum < 1 && sharesNum > 0 && canAfford;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToken || !isValidOrder) return;

    await createOrder.mutateAsync({
      tokenId: selectedToken.token_id,
      price: priceNum,
      size: sharesNum,
      side,
      orderType,
      market,
    });

    setShares('');
  };

  const setQuickPrice = (pct: number) => {
    setPrice((pct / 100).toFixed(2));
  };

  if (!user) {
    return (
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Trade</h3>
              <p className="text-xs text-muted-foreground">Place orders</p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">Sign in to trade</p>
          <button className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!selectedToken) {
    return (
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Trade</h3>
              <p className="text-xs text-muted-foreground">Place orders</p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Select an outcome to trade</p>
        </div>
      </div>
    );
  }

  const isYes = selectedToken.outcome === 'Yes';

  return (
    <div className="glass rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isYes
                  ? 'bg-gradient-to-br from-success/30 to-success/10'
                  : 'bg-gradient-to-br from-destructive/30 to-destructive/10'
              }`}
            >
              <Zap className={`w-5 h-5 ${isYes ? 'text-success' : 'text-destructive'}`} />
            </div>
            <div>
              <h3 className="font-semibold">Trade {selectedToken.outcome}</h3>
              <p className="text-xs text-muted-foreground">
                ${parseFloat(usdcBalance).toFixed(2)} available
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Buy/Sell Toggle */}
      <div className="p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex rounded-xl bg-white/5 p-1">
          <button
            onClick={() => setSide('BUY')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              side === 'BUY'
                ? 'bg-success text-white shadow-lg shadow-success/25'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setSide('SELL')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              side === 'SELL'
                ? 'bg-destructive text-white shadow-lg shadow-destructive/25'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sell
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1 flex flex-col">
        {/* Price Input */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {orderType === 'FOK' ? 'Market Price' : 'Price (probability)'}
          </label>
          <div className="relative">
            <input
              type="number"
              value={price}
              onChange={(e) => orderType === 'GTC' && setPrice(e.target.value)}
              placeholder={marketPrice ? marketPrice.toFixed(2) : '0.50'}
              step="0.01"
              min="0.01"
              max="0.99"
              disabled={orderType === 'FOK'}
              className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10 font-mono transition-all ${
                orderType === 'FOK' ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
              ¢
            </span>
          </div>
          {orderType === 'GTC' ? (
            <div className="space-y-2 mt-2">
              {marketPrice && (
                <p className="text-xs text-muted-foreground">
                  Best {side === 'BUY' ? 'ask' : 'bid'}: <span className="text-foreground font-mono">{(marketPrice * 100).toFixed(0)}¢</span>
                </p>
              )}
              <div className="flex gap-2">
                {[10, 25, 50, 75, 90].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setQuickPrice(pct)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      price === (pct / 100).toFixed(2)
                        ? 'bg-primary text-white'
                        : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {pct}¢
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              Auto-filled from {side === 'BUY' ? 'best ask' : 'best bid'}: <span className="text-foreground font-mono">{marketPrice ? (marketPrice * 100).toFixed(0) : '--'}¢</span>
            </p>
          )}
        </div>

        {/* Shares Input */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Shares
          </label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="100"
            step="1"
            min="1"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono transition-all"
          />
        </div>

        {/* Order Type */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Order Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOrderType('GTC')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                orderType === 'GTC'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
              }`}
            >
              Limit (GTC)
            </button>
            <button
              type="button"
              onClick={() => setOrderType('FOK')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                orderType === 'FOK'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
              }`}
            >
              Market (FOK)
            </button>
          </div>
        </div>

        {/* Order Summary */}
        {sharesNum > 0 && priceNum > 0 && (
          <div className="rounded-xl bg-white/5 border border-white/5 overflow-hidden">
            <div className="p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-mono font-medium">${cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max Payout</span>
                <span className="font-mono font-medium">${sharesNum.toFixed(2)}</span>
              </div>
            </div>
            <div className="px-3 py-2 bg-success/10 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-success">Potential Return</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-success">
                    +${potentialReturn.toFixed(2)}
                  </span>
                  <span className="text-xs text-success/70">
                    ({((potentialReturn / cost) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning if can't afford */}
        {!canAfford && sharesNum > 0 && priceNum > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Insufficient balance</span>
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1" />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValidOrder || createOrder.isPending}
          className={`
            relative w-full py-4 rounded-xl font-semibold transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
            overflow-hidden group
            ${
              side === 'BUY'
                ? 'bg-gradient-to-r from-success to-success/80 text-white shadow-lg shadow-success/25 hover:shadow-success/40'
                : 'bg-gradient-to-r from-destructive to-destructive/80 text-white shadow-lg shadow-destructive/25 hover:shadow-destructive/40'
            }
          `}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

          {createOrder.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Placing order...
            </>
          ) : (
            <>
              {side === 'BUY' ? 'Buy' : 'Sell'} {selectedToken.outcome}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {/* Current Spread Info */}
        {spread && (
          <div className="text-center text-xs text-muted-foreground">
            Spread: {(parseFloat(spread.bid) * 100).toFixed(1)}¢ /{' '}
            {(parseFloat(spread.ask) * 100).toFixed(1)}¢
          </div>
        )}
      </form>
    </div>
  );
}
