import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  walletAddress: string | null;
  usdcBalance: string;
  polBalance: string;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setBalances: (usdc: string, pol: string) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  walletAddress: null,
  usdcBalance: '0',
  polBalance: '0',
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setWalletAddress: (walletAddress) => set({ walletAddress }),
  setBalances: (usdcBalance, polBalance) => set({ usdcBalance, polBalance }),
  reset: () =>
    set({
      user: null,
      loading: false,
      walletAddress: null,
      usdcBalance: '0',
      polBalance: '0',
    }),
}));

// Market state
interface MarketState {
  selectedMarket: string | null;
  selectedTokenId: string | null;
  setSelectedMarket: (marketId: string | null) => void;
  setSelectedTokenId: (tokenId: string | null) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  selectedMarket: null,
  selectedTokenId: null,
  setSelectedMarket: (selectedMarket) => set({ selectedMarket }),
  setSelectedTokenId: (selectedTokenId) => set({ selectedTokenId }),
}));

// Toast notifications
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    // Auto-remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
