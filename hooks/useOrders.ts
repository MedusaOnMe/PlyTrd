import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useToastStore } from '@/lib/store';
import { getIdToken } from '@/lib/firebase-client';
import { Order, CreateOrderParams, GammaMarket } from '@/lib/polymarket/types';

interface OrdersResponse {
  orders: Order[];
}

export function useOrders(market?: string) {
  const { user } = useAuthStore();

  return useQuery<OrdersResponse>({
    queryKey: ['orders', market],
    queryFn: async () => {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');

      const url = market ? `/api/orders?market=${market}` : '/api/orders';
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async ({
      tokenId,
      price,
      size,
      side,
      orderType,
      market,
    }: CreateOrderParams & { market: GammaMarket }) => {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tokenId, price, size, side, orderType, market }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      return response.json();
    },
    onSuccess: () => {
      addToast('success', 'Order placed successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel order');
      }

      return response.json();
    },
    onSuccess: () => {
      addToast('success', 'Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      addToast('error', error.message);
    },
  });
}
