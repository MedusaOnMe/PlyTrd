'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { onAuthChange } from '@/lib/firebase-client';
import { useAuthStore } from '@/lib/store';
import { Toast } from '@/components/ui/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const { setUser, setLoading, setWalletAddress, setBalances } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      if (user) {
        // Fetch user data from API
        try {
          const token = await user.getIdToken();
          const response = await fetch('/api/user', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setWalletAddress(data.walletAddress);
            setBalances(data.usdcBalance || '0', data.polBalance || '0');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setWalletAddress(null);
        setBalances('0', '0');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading, setWalletAddress, setBalances]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toast />
    </QueryClientProvider>
  );
}
