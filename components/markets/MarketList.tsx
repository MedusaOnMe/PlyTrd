'use client';

import { useMarkets } from '@/hooks/useMarkets';
import { MarketCard, MarketCardSkeleton } from './MarketCard';
import { Search, Filter, AlertCircle } from 'lucide-react';
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

export function MarketList() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading, error } = useMarkets({
    active: true,
    limit: 100,
    tag: category || undefined,
  });

  const filteredMarkets = useMemo(() => {
    if (!data?.markets) return [];
    if (!search) return data.markets;

    const searchLower = search.toLowerCase();
    return data.markets.filter(
      (market) =>
        market.question.toLowerCase().includes(searchLower) ||
        market.category?.toLowerCase().includes(searchLower)
    );
  }, [data?.markets, search]);

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
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
          {filteredMarkets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No markets found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMarkets.map((market, index) => (
                <MarketCard key={market.id || market.condition_id || index} market={market} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
