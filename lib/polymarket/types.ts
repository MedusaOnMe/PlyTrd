// Polymarket API Types

// Market from Gamma API
export interface GammaMarket {
  id: string;
  condition_id: string;
  question_id: string;
  question: string;
  description: string;
  market_slug: string;
  category: string;
  end_date_iso: string;
  game_start_time?: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  icon: string;
  image?: string;
  tokens?: Array<{
    token_id: string;
    outcome: string;
    price?: number;
  }>;
  outcomePrices?: string; // JSON string array like "[\"0.5\", \"0.5\"]"
  outcomes?: string; // JSON string array like "[\"Yes\", \"No\"]"
  clobTokenIds?: string; // JSON string array of token IDs
  minimum_order_size: string;
  minimum_tick_size: string;
  neg_risk: boolean;
  volume?: string;
  volume24hr?: number;
  liquidity?: string;
}

// Event from Gamma API
export interface GammaEvent {
  id: number;
  slug: string;
  title: string;
  description: string;
  start_date?: string;
  end_date?: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  featured: boolean;
  icon: string;
  image?: string;
  liquidity?: number;
  volume?: number;
  volume24hr?: number;
  markets: GammaMarket[];
  tags?: Array<{ label: string; slug: string }>;
  neg_risk: boolean;
}

// Order Book
export interface OrderBookLevel {
  price: string;
  size: string;
}

export interface OrderBook {
  market: string;
  asset_id: string;
  hash: string;
  timestamp: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  min_order_size?: string;
  tick_size?: string;
  neg_risk?: boolean;
}

// Orders
export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'GTC' | 'GTD' | 'FOK' | 'FAK';
export type OrderStatus = 'live' | 'matched' | 'delayed' | 'unmatched' | 'cancelled';

export interface Order {
  id: string;
  market: string;
  asset_id: string;
  side: OrderSide;
  price: string;
  original_size: string;
  size_matched: string;
  outcome: string;
  owner: string;
  created_at: number;
  expiration: number;
  status: OrderStatus;
  order_type: OrderType;
  associate_trades?: Trade[];
}

export interface CreateOrderParams {
  tokenId: string;
  price: number;
  size: number;
  side: OrderSide;
  orderType?: OrderType;
  expiration?: number;
}

export interface OrderResponse {
  success: boolean;
  errorMsg?: string;
  orderId?: string;
  orderHashes?: string[];
  status?: OrderStatus;
}

// Trades
export interface Trade {
  id: string;
  taker_order_id: string;
  market: string;
  asset_id: string;
  side: OrderSide;
  size: string;
  fee_rate_bps: string;
  price: string;
  status: 'MATCHED' | 'MINED' | 'CONFIRMED' | 'RETRYING' | 'FAILED';
  match_time: string;
  last_update: string;
  outcome: string;
  bucket_index: number;
  owner: string;
  maker_address: string;
  transaction_hash?: string;
  trader_side: 'MAKER' | 'TAKER';
}

// Positions
export interface Position {
  asset: string;
  condition_id: string;
  market_slug: string;
  event_slug: string;
  title: string;
  outcome: string;
  outcome_index: number;
  size: string;
  avg_price: string;
  initial_value: string;
  current_value: string;
  cash_pnl: string;
  percent_pnl: string;
  realized_pnl: string;
  percent_realized_pnl: string;
  redeemable: boolean;
  mergeable: boolean;
  neg_risk: boolean;
  icon?: string;
  end_date?: string;
}

// User Balance
export interface Balance {
  usdc: string;
  pol: string;
}

export interface Allowance {
  ctfExchange: boolean;
  negRiskCtfExchange: boolean;
  negRiskAdapter: boolean;
}

// API Credentials
export interface ApiCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}

// Price/Spread
export interface Spread {
  asset_id: string;
  bid: string;
  ask: string;
  spread: string;
}

export interface Price {
  token_id: string;
  price: string;
}

// WebSocket Messages
export interface WSMarketUpdate {
  type: 'price_change' | 'book' | 'tick_size_change' | 'last_trade_price';
  asset_id: string;
  market: string;
  price?: string;
  timestamp: number;
}

export interface WSUserUpdate {
  type: 'trade' | 'order';
  data: Trade | Order;
}

// API Response wrappers
export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string;
  limit: number;
  count: number;
}
