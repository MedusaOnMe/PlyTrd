'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useMarketDetail } from '@/hooks/useMarkets';
import { OrderBook } from '@/components/markets/OrderBook';
import { PriceChart } from '@/components/markets/PriceChart';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { AIAnalysis } from '@/components/markets/AIAnalysis';
import { SlotBasedLayout, LayoutComponent } from '@/components/layout/SlotBasedLayout';
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  ExternalLink,
  Loader2,
  ChevronDown,
  BarChart3,
  Zap,
  Star,
  Layout,
} from 'lucide-react';
import Link from 'next/link';
import { useWatchlistStore, useSlotLayoutStore, SlotAssignment } from '@/lib/store';

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
  const [useDraggableLayout, setUseDraggableLayout] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlistStore();
  const { marketSlots, setMarketSlots, resetMarketSlots } = useSlotLayoutStore();

  // Hydration effect - load preferences from localStorage after mount
  useEffect(() => {
    setIsHydrated(true);
    const saved = localStorage.getItem('polyterm-draggable-layout');
    if (saved === 'true') setUseDraggableLayout(true);
  }, []);

  const toggleDraggableLayout = useCallback(() => {
    setUseDraggableLayout((prev) => {
      const newValue = !prev;
      localStorage.setItem('polyterm-draggable-layout', String(newValue));
      return newValue;
    });
  }, []);

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

  const handleSaveLayout = useCallback(
    (assignment: SlotAssignment) => {
      setMarketSlots(assignment);
    },
    [setMarketSlots]
  );

  // Derived data - safe to compute even when data is loading
  const event = data?.event;
  const tokenData = data?.tokenData;
  const isMarketGroup = (event?.markets?.length ?? 0) > 1;
  const market = event?.markets?.[selectedMarketIndex];
  const tokens = market?.tokens ?? [];
  const selectedToken = tokens[selectedTokenIndex];
  const selectedTokenData = tokenData?.find(
    (t) => t.token_id === selectedToken?.token_id
  );

  const getMarketYesPrice = useCallback(
    (m: typeof market) => {
      if (!m) return null;
      const yesToken = m.tokens?.find((t) => t.outcome === 'Yes');
      if (!yesToken) return null;
      const td = tokenData?.find((t) => t.token_id === yesToken.token_id);
      if (td?.spread?.bid) return Math.round(parseFloat(td.spread.bid) * 100);
      if (yesToken.price) return Math.round(yesToken.price * 100);
      return null;
    },
    [tokenData]
  );

  const currentYesPrice = getMarketYesPrice(market);

  // Watchlist helpers
  const watchlistSlug = slug;
  const inWatchlist = isInWatchlist(watchlistSlug);
  const yesToken = tokens.find((t) => t.outcome === 'Yes');

  const handleWatchlistToggle = useCallback(() => {
    if (inWatchlist) {
      removeFromWatchlist(watchlistSlug);
    } else if (yesToken) {
      // Get the current price for the yes token
      const td = tokenData?.find((t) => t.token_id === yesToken.token_id);
      const price = td?.spread?.bid || (yesToken.price ? String(yesToken.price) : undefined);

      addToWatchlist({
        slug: watchlistSlug,
        question: market?.question || event?.title || '',
        tokenId: yesToken.token_id,
        outcome: 'Yes',
        initialPrice: price,
      });
    }
  }, [inWatchlist, removeFromWatchlist, watchlistSlug, yesToken, addToWatchlist, market?.question, event?.title, tokenData]);

  // Default layout assignment - positions with row, order, and stack
  const defaultLayoutAssignment: SlotAssignment = {
    orderbook: { row: 'top', order: 0, stack: 'full' },
    chart: { row: 'top', order: 1, stack: 'full' },
    trading: { row: 'top', order: 2, stack: 'full' },
    analysis: { row: 'bottom', order: 0, stack: 'full' },
  };

  // Get current assignment (saved or default)
  const currentAssignment = marketSlots || defaultLayoutAssignment;

  // Check if components are in bottom row for compact layout
  const isOrderbookCompact = currentAssignment.orderbook?.row === 'bottom';
  const isTradingCompact = currentAssignment.trading?.row === 'bottom';

  // Layout components for slot-based layout
  const layoutComponents: LayoutComponent[] = useMemo(() => [
    {
      id: 'chart',
      title: 'Price Chart',
      content: selectedToken?.token_id ? (
        <PriceChart tokenId={selectedToken.token_id} outcome={selectedToken.outcome} className="h-full" />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No token selected
        </div>
      ),
      fixedWidth: 6, // Chart always takes 6 columns (50%)
    },
    {
      id: 'orderbook',
      title: 'Order Book',
      content: (
        <OrderBook
          orderBook={selectedTokenData?.orderBook}
          assetId={selectedToken?.token_id}
          enableRealtime={true}
          onSelectPrice={(price, side) => console.log('Selected price:', price, side)}
          className="h-full"
          compact={isOrderbookCompact}
        />
      ),
    },
    {
      id: 'trading',
      title: 'Trading',
      content: isTradingCompact ? (
        // Compact horizontal layout for bottom row
        <div className="h-full flex flex-row gap-2">
          {/* Token selector - vertical strip */}
          {market && tokens.length > 0 && (
            <div className="flex flex-col gap-1 p-1 border-r border-white/5 flex-shrink-0">
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
                    className={`py-1 px-2 rounded-lg transition-all text-center ${
                      isSelected
                        ? isYes
                          ? 'bg-success/20 ring-1 ring-success'
                          : 'bg-destructive/20 ring-1 ring-destructive'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className={`text-[10px] font-medium ${isYes ? 'text-success' : 'text-destructive'}`}>
                      {token.outcome}
                    </span>
                    <span className="text-xs font-bold ml-1">{price}¢</span>
                  </button>
                );
              })}
            </div>
          )}
          {/* Trading Panel - compact */}
          {market && (
            <div className="flex-1 min-h-0">
              <TradingPanel
                market={market}
                selectedToken={selectedToken}
                spread={selectedTokenData?.spread}
                compact={true}
              />
            </div>
          )}
        </div>
      ) : (
        // Full vertical layout for top row
        <div className="h-full flex flex-col">
          {/* Token selector */}
          {market && tokens.length > 0 && (
            <div className="flex gap-1 p-2 border-b border-white/5 flex-shrink-0">
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
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                      isSelected
                        ? isYes
                          ? 'bg-success/20 ring-1 ring-success'
                          : 'bg-destructive/20 ring-1 ring-destructive'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isYes ? 'text-success' : 'text-destructive'}`}>
                      {token.outcome}
                    </span>
                    <span className="text-sm font-bold ml-1">{price}¢</span>
                  </button>
                );
              })}
            </div>
          )}
          {/* Trading Panel - full */}
          {market && (
            <div className="flex-1 min-h-0">
              <TradingPanel
                market={market}
                selectedToken={selectedToken}
                spread={selectedTokenData?.spread}
                compact={false}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'analysis',
      title: 'AI Analysis',
      content: (
        <AIAnalysis
          question={market?.question || event?.title || ''}
          description={event?.description}
          currentPrice={currentYesPrice ?? undefined}
        />
      ),
    },
  ], [selectedToken, selectedTokenData, market, tokens, tokenData, selectedTokenIndex, event, currentYesPrice, isOrderbookCompact, isTradingCompact]);

  // Close layout mode
  const handleCloseLayout = useCallback(() => {
    setUseDraggableLayout(false);
    localStorage.setItem('polyterm-draggable-layout', 'false');
  }, []);

  // Loading state
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

  // Error state
  if (error || !event) {
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

  return (
    <div className="mx-auto px-4 lg:px-6 py-4 max-w-[1800px] animate-fadeIn">
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

        {/* Right side - Controls + Price Badge + Watchlist */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Layout toggle */}
          <button
            onClick={toggleDraggableLayout}
            className={`p-2 rounded-lg transition-all ${
              useDraggableLayout
                ? 'bg-primary/20 text-primary'
                : 'glass glass-hover text-muted-foreground'
            }`}
            title={useDraggableLayout ? 'Use static layout' : 'Use customizable layout'}
          >
            <Layout className="w-4 h-4" />
          </button>

          {/* Watchlist Button */}
          <button
            onClick={handleWatchlistToggle}
            className={`p-2 rounded-lg transition-all ${
              inWatchlist
                ? 'bg-yellow-500/20 text-yellow-500'
                : 'glass glass-hover text-muted-foreground hover:text-yellow-500'
            }`}
            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Star className={`w-5 h-5 ${inWatchlist ? 'fill-current' : ''}`} />
          </button>

          {/* Price Badge */}
          {currentYesPrice !== null && (
            <div className="text-right ml-2">
              <div className="text-3xl font-bold gradient-text">{currentYesPrice}%</div>
              <div className="text-xs text-muted-foreground">Yes Price</div>
            </div>
          )}
        </div>
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

      {/* Main Content - Always use SlotBasedLayout, editable controls edit mode */}
      {isHydrated && (
        <SlotBasedLayout
          components={layoutComponents}
          defaultAssignment={defaultLayoutAssignment}
          savedAssignment={marketSlots}
          onSave={handleSaveLayout}
          onReset={resetMarketSlots}
          onClose={handleCloseLayout}
          editable={useDraggableLayout}
        />
      )}
    </div>
  );
}
