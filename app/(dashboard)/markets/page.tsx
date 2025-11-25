'use client';

import { MarketList } from '@/components/markets/MarketList';

export default function MarketsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Markets</h1>
        <p className="text-muted-foreground">
          Browse and trade prediction markets on Polymarket
        </p>
      </div>
      <MarketList />
    </div>
  );
}
