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

// Watchlist - persisted to localStorage
export interface WatchlistItem {
  slug: string;
  question: string;
  tokenId: string;
  outcome: string;
  initialPrice?: string; // Price when added to watchlist
  addedAt: number;
}

interface WatchlistState {
  items: WatchlistItem[];
  addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>) => void;
  removeFromWatchlist: (slug: string) => void;
  isInWatchlist: (slug: string) => boolean;
  reorderWatchlist: (fromIndex: number, toIndex: number) => void;
}

const loadWatchlist = (): WatchlistItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('polyterm-watchlist');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveWatchlist = (items: WatchlistItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('polyterm-watchlist', JSON.stringify(items));
};

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: loadWatchlist(),
  addToWatchlist: (item) => {
    const newItem = { ...item, addedAt: Date.now() };
    set((state) => {
      const exists = state.items.some((i) => i.slug === item.slug);
      if (exists) return state;
      const newItems = [...state.items, newItem];
      saveWatchlist(newItems);
      return { items: newItems };
    });
  },
  removeFromWatchlist: (slug) => {
    set((state) => {
      const newItems = state.items.filter((i) => i.slug !== slug);
      saveWatchlist(newItems);
      return { items: newItems };
    });
  },
  isInWatchlist: (slug) => get().items.some((i) => i.slug === slug),
  reorderWatchlist: (fromIndex, toIndex) => {
    set((state) => {
      const newItems = [...state.items];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      saveWatchlist(newItems);
      return { items: newItems };
    });
  },
}));

// Layout preferences - persisted to localStorage
export interface PanelLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}

interface LayoutState {
  marketPageLayout: PanelLayout[];
  dashboardLayout: PanelLayout[];
  setMarketPageLayout: (layout: PanelLayout[]) => void;
  setDashboardLayout: (layout: PanelLayout[]) => void;
  resetLayout: (page: 'market' | 'dashboard') => void;
}

const DEFAULT_MARKET_LAYOUT: PanelLayout[] = [
  { id: 'chart', x: 0, y: 0, w: 6, h: 5, visible: true },
  { id: 'orderbook', x: 6, y: 0, w: 3, h: 5, visible: true },
  { id: 'trading', x: 9, y: 0, w: 3, h: 5, visible: true },
  { id: 'analysis', x: 0, y: 5, w: 12, h: 3, visible: true },
];

const DEFAULT_DASHBOARD_LAYOUT: PanelLayout[] = [
  { id: 'watchlist', x: 0, y: 0, w: 4, h: 2, visible: true },
  { id: 'movers', x: 4, y: 0, w: 4, h: 2, visible: true },
  { id: 'positions', x: 8, y: 0, w: 4, h: 2, visible: true },
  { id: 'markets', x: 0, y: 2, w: 12, h: 3, visible: true },
];

export const useLayoutStore = create<LayoutState>((set) => {
  // Load from localStorage on client-side only
  const loadFromStorage = () => {
    if (typeof window === 'undefined') return {};
    try {
      const marketLayout = localStorage.getItem('polyterm-market-layout');
      const dashboardLayout = localStorage.getItem('polyterm-dashboard-layout');
      return {
        marketPageLayout: marketLayout ? JSON.parse(marketLayout) : DEFAULT_MARKET_LAYOUT,
        dashboardLayout: dashboardLayout ? JSON.parse(dashboardLayout) : DEFAULT_DASHBOARD_LAYOUT,
      };
    } catch {
      return {};
    }
  };

  // Initialize with defaults, will be hydrated on client
  const initialState = {
    marketPageLayout: DEFAULT_MARKET_LAYOUT,
    dashboardLayout: DEFAULT_DASHBOARD_LAYOUT,
    ...loadFromStorage(),
  };

  return {
    ...initialState,
    setMarketPageLayout: (layout) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('polyterm-market-layout', JSON.stringify(layout));
      }
      set({ marketPageLayout: layout });
    },
    setDashboardLayout: (layout) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('polyterm-dashboard-layout', JSON.stringify(layout));
      }
      set({ dashboardLayout: layout });
    },
    resetLayout: (page) => {
      if (page === 'market') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('polyterm-market-layout', JSON.stringify(DEFAULT_MARKET_LAYOUT));
        }
        set({ marketPageLayout: DEFAULT_MARKET_LAYOUT });
      } else {
        if (typeof window !== 'undefined') {
          localStorage.setItem('polyterm-dashboard-layout', JSON.stringify(DEFAULT_DASHBOARD_LAYOUT));
        }
        set({ dashboardLayout: DEFAULT_DASHBOARD_LAYOUT });
      }
    },
  };
});

// Position-based layout - components have fixed sizes and swap positions
export interface LayoutPosition {
  row: 'top' | 'bottom';
  order: number;
  stack?: 'full' | 'top' | 'bottom'; // Vertical position within column (default: 'full')
}
export type LayoutAssignment = Record<string, LayoutPosition>;

// Re-export as SlotAssignment for backwards compatibility
export type SlotAssignment = LayoutAssignment;

interface SlotLayoutState {
  marketSlots: LayoutAssignment;
  setMarketSlots: (slots: LayoutAssignment) => void;
  resetMarketSlots: () => void;
}

const DEFAULT_POSITION_LAYOUT: LayoutAssignment = {
  orderbook: { row: 'top', order: 0, stack: 'full' },
  chart: { row: 'top', order: 1, stack: 'full' },
  trading: { row: 'top', order: 2, stack: 'full' },
  analysis: { row: 'bottom', order: 0, stack: 'full' },
};

export const useSlotLayoutStore = create<SlotLayoutState>((set) => {
  const loadFromStorage = (): LayoutAssignment | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('polyterm-market-layout-v2');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  return {
    marketSlots: loadFromStorage() || DEFAULT_POSITION_LAYOUT,
    setMarketSlots: (slots) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('polyterm-market-layout-v2', JSON.stringify(slots));
      }
      set({ marketSlots: slots });
    },
    resetMarketSlots: () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('polyterm-market-layout-v2', JSON.stringify(DEFAULT_POSITION_LAYOUT));
      }
      set({ marketSlots: DEFAULT_POSITION_LAYOUT });
    },
  };
});

// Keyboard shortcuts state
interface HotkeyState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useHotkeyStore = create<HotkeyState>((set) => ({
  enabled: true,
  setEnabled: (enabled) => set({ enabled }),
}));
