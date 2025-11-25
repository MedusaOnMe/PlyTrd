'use client';

import { useMarkets } from '@/hooks/useMarkets';
import { MarketCard, MarketCardSkeleton } from './MarketCard';
import { Search, AlertCircle, ArrowUpDown, TrendingUp, Clock, Droplets } from 'lucide-react';
import { useState, useMemo } from 'react';

const CATEGORIES = [
  { slug: '', label: 'All' },
  { slug: 'politics', label: 'Politics' },
  { slug: 'crypto', label: 'Crypto' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'entertainment', label: 'Entertainment' },
  { slug: 'science', label: 'Science' },
  { slug: 'business', label: 'Business' },
];

type SortOption = 'volume' | 'volume24hr' | 'liquidity' | 'ending_soon';

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof TrendingUp }[] = [
  { value: 'volume', label: 'Volume', icon: TrendingUp },
  { value: 'volume24hr', label: '24h Volume', icon: TrendingUp },
  { value: 'liquidity', label: 'Liquidity', icon: Droplets },
  { value: 'ending_soon', label: 'Ending Soon', icon: Clock },
];

export function MarketList() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('volume');

  const { data, isLoading, error } = useMarkets({
    active: true,
    limit: 100,
    tag: category || undefined,
  });

  const filteredAndSortedMarkets = useMemo(() => {
    if (!data?.markets) return [];

    let markets = [...data.markets];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      markets = markets.filter(
        (market) =>
          market.question.toLowerCase().includes(searchLower) ||
          market.category?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    markets.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return (parseFloat(b.volume || '0')) - (parseFloat(a.volume || '0'));
        case 'volume24hr':
          return (b.volume24hr || 0) - (a.volume24hr || 0);
        case 'liquidity':
          return (parseFloat(b.liquidity || '0')) - (parseFloat(a.liquidity || '0'));
        case 'ending_soon':
          const aDate = a.end_date_iso ? new Date(a.end_date_iso).getTime() : Infinity;
          const bDate = b.end_date_iso ? new Date(b.end_date_iso).getTime() : Infinity;
          return aDate - bDate;
        default:
          return 0;
      }
    });

    return markets;
  }, [data?.markets, search, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search markets..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm cursor-pointer"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={`
                px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors
                ${
                  category === cat.slug
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load markets. Please try again.</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Markets Grid */}
      {!isLoading && !error && (
        <>
          {filteredAndSortedMarkets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No markets found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedMarkets.map((market, index) => (
                <MarketCard key={market.id || market.condition_id || index} market={market} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
