import { useQuery } from '@tanstack/react-query';
import { GammaEvent, GammaMarket } from '@/lib/polymarket/types';

interface MarketsResponse {
  events: GammaEvent[];
  markets: (GammaMarket & {
    event_id: number;
    event_slug: string;
    event_title: string;
    event_icon: string;
  })[];
  count: number;
}

interface MarketDetailResponse {
  event: GammaEvent;
  tokenData: Array<{
    token_id: string;
    outcome: string;
    orderBook: any;
    spread: any;
  }>;
}

export function useMarkets(params?: {
  active?: boolean;
  closed?: boolean;
  limit?: number;
  offset?: number;
  tag?: string;
}) {
  return useQuery<MarketsResponse>({
    queryKey: ['markets', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.active !== undefined)
        searchParams.set('active', String(params.active));
      if (params?.closed !== undefined)
        searchParams.set('closed', String(params.closed));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      if (params?.tag) searchParams.set('tag', params.tag);

      const response = await fetch(`/api/markets?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch markets');
      }
      return response.json();
    },
  });
}

export function useMarketDetail(slug: string | undefined | null) {
  return useQuery<MarketDetailResponse>({
    queryKey: ['market', slug],
    queryFn: async () => {
      if (!slug) {
        throw new Error('No slug provided');
      }
      const response = await fetch(`/api/markets/${encodeURIComponent(slug)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market');
      }
      return response.json();
    },
    enabled: Boolean(slug),
  });
}
