import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { getIdToken } from '@/lib/firebase-client';
import { Position, Trade } from '@/lib/polymarket/types';

interface PositionsResponse {
  positions: Position[];
  trades: Trade[];
  summary: {
    totalValue: string;
    totalPnl: string;
    totalInitial: string;
    percentPnl: string;
  };
}

export function usePositions(includeTrades = false) {
  const { user } = useAuthStore();

  return useQuery<PositionsResponse>({
    queryKey: ['positions', includeTrades],
    queryFn: async () => {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');

      const url = includeTrades ? '/api/positions?trades=true' : '/api/positions';
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch positions');
      }
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
