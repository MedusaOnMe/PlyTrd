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
  compact?: boolean; // true = horizontal layout for bottom row, false = vertical for top row
}

export function TradingPanel({
  market,
  selectedToken,
  spread,
  compact = false,
}: TradingPanelProps) {
  const { user, usdcBalance } = useAuthStore();
  const createOrder = useCreateOrder();

  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'GTC' | 'FOK'>('FOK');
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
      <div className="glass rounded-xl overflow-hidden h-full flex flex-col">
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Trade</h3>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
            <Info className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">Sign in to trade</p>
          <button className="px-4 py-2 bg-primary text-white text-sm rounded-lg font-medium hover:opacity-90 transition-opacity">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!selectedToken) {
    return (
      <div className="glass rounded-xl overflow-hidden h-full flex flex-col">
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-transparent flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Trade</h3>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Select an outcome to trade</p>
        </div>
      </div>
    );
  }

  const isYes = selectedToken.outcome === 'Yes';

  return (
    <div className="glass rounded-xl overflow-hidden h-full flex flex-col">
      {/* Compact Header with Buy/Sell Toggle */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isYes
                  ? 'bg-gradient-to-br from-success/30 to-success/10'
                  : 'bg-gradient-to-br from-destructive/30 to-destructive/10'
              }`}
            >
              <Zap className={`w-4 h-4 ${isYes ? 'text-success' : 'text-destructive'}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Trade {selectedToken.outcome}</h3>
              <p className="text-[10px] text-muted-foreground">
                ${parseFloat(usdcBalance).toFixed(2)} available
              </p>
            </div>
          </div>
          {/* Buy/Sell Toggle inline */}
          <div className="flex rounded-lg bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setSide('BUY')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                side === 'BUY'
                  ? 'bg-success text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSide('SELL')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                side === 'SELL'
                  ? 'bg-destructive text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sell
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`flex-1 flex flex-col ${compact ? 'p-3' : 'p-4'}`}>
        {compact ? (
          // Compact horizontal layout for bottom row
          <>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[100px]">
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {orderType === 'FOK' ? 'Market Price' : 'Price'}
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
                    className={`w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-8 font-mono text-sm transition-all ${
                      orderType === 'FOK' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs">¢</span>
                </div>
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Shares</label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="100"
                  step="1"
                  min="1"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm transition-all"
                />
              </div>
              <div className="min-w-[140px]">
                <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Type</label>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setOrderType('GTC')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${orderType === 'GTC' ? 'bg-primary text-white' : 'bg-white/5 hover:bg-white/10 text-muted-foreground'}`}>Limit</button>
                  <button type="button" onClick={() => setOrderType('FOK')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${orderType === 'FOK' ? 'bg-primary text-white' : 'bg-white/5 hover:bg-white/10 text-muted-foreground'}`}>Market</button>
                </div>
              </div>
              <button type="submit" disabled={!isValidOrder || createOrder.isPending} className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${side === 'BUY' ? 'bg-success text-white hover:bg-success/90' : 'bg-destructive text-white hover:bg-destructive/90'}`}>
                {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{side === 'BUY' ? 'Buy' : 'Sell'}<ArrowRight className="w-3 h-3" /></>}
              </button>
            </div>
            {orderType === 'GTC' && (
              <div className="flex gap-1 mt-2">
                {[10, 25, 50, 75, 90].map((pct) => (
                  <button key={pct} type="button" onClick={() => setQuickPrice(pct)} className={`flex-1 py-1 text-[10px] font-medium rounded transition-all ${price === (pct / 100).toFixed(2) ? 'bg-primary text-white' : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground'}`}>{pct}¢</button>
                ))}
              </div>
            )}
            {sharesNum > 0 && priceNum > 0 && (
              <div className="mt-3 flex items-center gap-4 p-2 rounded-lg bg-white/5 border border-white/5 flex-wrap">
                <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">Cost:</span><span className="font-mono font-medium">${cost.toFixed(2)}</span></div>
                <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">Payout:</span><span className="font-mono font-medium">${sharesNum.toFixed(2)}</span></div>
                <div className="flex items-center gap-2 text-xs text-success"><span>Return:</span><span className="font-mono font-bold">+${potentialReturn.toFixed(2)}</span><span className="text-success/70">({((potentialReturn / cost) * 100).toFixed(0)}%)</span></div>
                {!canAfford && <div className="flex items-center gap-1 text-xs text-destructive ml-auto"><AlertCircle className="w-3 h-3" /><span>Insufficient</span></div>}
              </div>
            )}
          </>
        ) : (
          // Full vertical layout for top row
          <>
            {/* Price Input */}
            <div className="mb-3">
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
                  className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10 font-mono transition-all ${orderType === 'FOK' ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">¢</span>
              </div>
              {orderType === 'GTC' && (
                <div className="flex gap-2 mt-2">
                  {[10, 25, 50, 75, 90].map((pct) => (
                    <button key={pct} type="button" onClick={() => setQuickPrice(pct)} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${price === (pct / 100).toFixed(2) ? 'bg-primary text-white' : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground'}`}>{pct}¢</button>
                  ))}
                </div>
              )}
            </div>

            {/* Shares Input */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Shares</label>
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
            <div className="mb-3">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Order Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setOrderType('GTC')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${orderType === 'GTC' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white/5 hover:bg-white/10 text-muted-foreground'}`}>Limit (GTC)</button>
                <button type="button" onClick={() => setOrderType('FOK')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${orderType === 'FOK' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-white/5 hover:bg-white/10 text-muted-foreground'}`}>Market (FOK)</button>
              </div>
            </div>

            {/* Order Summary */}
            {sharesNum > 0 && priceNum > 0 && (
              <div className="rounded-xl bg-white/5 border border-white/5 overflow-hidden mb-3">
                <div className="p-3 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cost</span><span className="font-mono font-medium">${cost.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Max Payout</span><span className="font-mono font-medium">${sharesNum.toFixed(2)}</span></div>
                </div>
                <div className="px-3 py-2 bg-success/10 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-success">Potential Return</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-success">+${potentialReturn.toFixed(2)}</span>
                      <span className="text-xs text-success/70">({((potentialReturn / cost) * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!canAfford && sharesNum > 0 && priceNum > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm mb-3">
                <AlertCircle className="w-4 h-4" /><span>Insufficient balance</span>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValidOrder || createOrder.isPending}
              className={`relative w-full py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden group ${side === 'BUY' ? 'bg-gradient-to-r from-success to-success/80 text-white shadow-lg shadow-success/25 hover:shadow-success/40' : 'bg-gradient-to-r from-destructive to-destructive/80 text-white shadow-lg shadow-destructive/25 hover:shadow-destructive/40'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {createOrder.isPending ? <><Loader2 className="w-5 h-5 animate-spin" />Placing order...</> : <>{side === 'BUY' ? 'Buy' : 'Sell'} {selectedToken.outcome}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
            </button>

            {spread && (
              <div className="text-center text-xs text-muted-foreground mt-3">
                Spread: {(parseFloat(spread.bid) * 100).toFixed(1)}¢ / {(parseFloat(spread.ask) * 100).toFixed(1)}¢
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
}
