'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useMarketDetail } from '@/hooks/useMarkets';
import { OrderBook } from '@/components/markets/OrderBook';
import { PriceChart } from '@/components/markets/PriceChart';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { AIAnalysis } from '@/components/markets/AIAnalysis';
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  ExternalLink,
  Loader2,
  ChevronDown,
  BarChart3,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function MarketDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const marketId = searchParams.get('m');
  const { data, isLoading, error } = useMarketDetail(slug);

  const [selectedMarketIndex, setSelectedMarketIndex] = useState(0);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
  const [showMarketSelector, setShowMarketSelector] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  useEffect(() => {
    if (data?.event?.markets && marketId && !hasAutoSelected) {
      const index = data.event.markets.findIndex(
        (m) => m.condition_id === marketId || m.id === marketId
      );
      if (index !== -1) {
        setSelectedMarketIndex(index);
        setHasAutoSelected(true);
      }
    }
  }, [data, marketId, hasAutoSelected]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.event) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center glass rounded-xl p-6">
          <Zap className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h2 className="font-bold mb-2">Market Not Found</h2>
          <Link href="/markets" className="text-primary hover:underline text-sm">
            ← Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  const { event, tokenData } = data;
  const isMarketGroup = event.markets.length > 1;
  const market = event.markets[selectedMarketIndex];
  const tokens = market?.tokens ?? [];
  const selectedToken = tokens[selectedTokenIndex];
  const selectedTokenData = tokenData?.find(
    (t) => t.token_id === selectedToken?.token_id
  );

  const getMarketYesPrice = (m: typeof market) => {
    const yesToken = m?.tokens?.find((t) => t.outcome === 'Yes');
    if (!yesToken) return null;
    const td = tokenData?.find((t) => t.token_id === yesToken.token_id);
    if (td?.spread?.bid) return Math.round(parseFloat(td.spread.bid) * 100);
    if (yesToken.price) return Math.round(yesToken.price * 100);
    return null;
  };

  const currentYesPrice = getMarketYesPrice(market);

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl animate-fadeIn">
      {/* Compact Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Link
            href="/markets"
            className="mt-1 p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          {event.icon && (
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
              <Image src={event.icon} alt="" fill className="object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-lg leading-tight truncate">
              {market?.question || event.title}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {event.volume && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  ${parseFloat(String(event.volume)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              )}
              {event.end_date && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(event.end_date).toLocaleDateString()}
                </span>
              )}
              <a
                href={`https://polymarket.com/event/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <ExternalLink className="w-3 h-3" />
                Polymarket
              </a>
            </div>
          </div>
        </div>

        {/* Price Badge */}
        {currentYesPrice !== null && (
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-bold gradient-text">{currentYesPrice}%</div>
            <div className="text-xs text-muted-foreground">Yes Price</div>
          </div>
        )}
      </div>

      {/* Market Group Selector - Compact */}
      {isMarketGroup && (
        <div className="glass rounded-lg mb-4 overflow-hidden">
          <button
            onClick={() => setShowMarketSelector(!showMarketSelector)}
            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{event.markets.length} outcomes</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showMarketSelector ? 'rotate-180' : ''}`} />
          </button>
          {showMarketSelector && (
            <div className="border-t border-white/5 max-h-48 overflow-y-auto">
              {event.markets.map((m, index) => (
                <button
                  key={m.id || m.condition_id || index}
                  onClick={() => {
                    setSelectedMarketIndex(index);
                    setSelectedTokenIndex(0);
                    setShowMarketSelector(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 hover:bg-white/5 text-sm ${
                    selectedMarketIndex === index ? 'bg-primary/10' : ''
                  }`}
                >
                  <span className="text-left truncate pr-2">{m.question}</span>
                  <span className="text-success font-medium">{getMarketYesPrice(m)}%</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Grid - Chart + Trading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Chart - Takes 2 cols */}
        <div className="lg:col-span-2">
          {selectedToken?.token_id && (
            <PriceChart tokenId={selectedToken.token_id} outcome={selectedToken.outcome} />
          )}
        </div>

        {/* Trading Panel + Outcome Selector */}
        <div className="space-y-4">
          {/* Compact Outcome Selector */}
          {market && tokens.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {tokens.map((token, index) => {
                const td = tokenData?.find((t) => t.token_id === token.token_id);
                const price = td?.spread?.bid
                  ? Math.round(parseFloat(td.spread.bid) * 100)
                  : token.price
                  ? Math.round(token.price * 100)
                  : 50;

                const isYes = token.outcome === 'Yes';
                const isSelected = selectedTokenIndex === index;

                return (
                  <button
                    key={token.token_id}
                    onClick={() => setSelectedTokenIndex(index)}
                    className={`p-3 rounded-lg transition-all text-center ${
                      isSelected
                        ? isYes
                          ? 'bg-success/20 ring-1 ring-success'
                          : 'bg-destructive/20 ring-1 ring-destructive'
                        : 'glass glass-hover'
                    }`}
                  >
                    <div className={`text-xs font-medium ${isYes ? 'text-success' : 'text-destructive'}`}>
                      {token.outcome}
                    </div>
                    <div className="text-xl font-bold">{price}¢</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Trading Panel */}
          <TradingPanel
            market={market}
            selectedToken={selectedToken}
            spread={selectedTokenData?.spread}
          />
        </div>
      </div>

      {/* Bottom Row - AI + Order Book side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AIAnalysis
          question={market?.question || event.title}
          description={event.description}
          currentPrice={currentYesPrice ?? undefined}
        />
        <OrderBook
          orderBook={selectedTokenData?.orderBook}
          assetId={selectedToken?.token_id}
          enableRealtime={true}
          onSelectPrice={(price, side) => console.log('Selected price:', price, side)}
        />
      </div>
    </div>
  );
}
