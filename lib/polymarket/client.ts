import { ClobClient, Side, OrderType as ClobOrderType } from '@polymarket/clob-client';
import { ethers } from 'ethers';
import {
  ApiCredentials,
  OrderBook,
  CreateOrderParams,
  OrderResponse,
  Order,
  Trade,
  Position,
  GammaEvent,
  GammaMarket,
  Spread,
} from './types';

const CLOB_URL = process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com';
const DATA_URL = process.env.POLYMARKET_DATA_URL || 'https://data-api.polymarket.com';
const GAMMA_URL = process.env.POLYMARKET_GAMMA_URL || 'https://gamma-api.polymarket.com';
const CHAIN_ID = parseInt(process.env.POLYGON_CHAIN_ID || '137');

// Contract addresses
const USDC_ADDRESS = process.env.USDC_ADDRESS || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const CTF_ADDRESS = process.env.CTF_ADDRESS || '0x4D97DCd97eC945f40cF65F87097ACe5EA0476045';
const CTF_EXCHANGE = process.env.CTF_EXCHANGE || '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E';
const NEG_RISK_CTF_EXCHANGE = process.env.NEG_RISK_CTF_EXCHANGE || '0xC5d563A36AE78145C45a50134d48A1215220f80a';
const NEG_RISK_ADAPTER = process.env.NEG_RISK_ADAPTER || '0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296';

// ERC20 ABI for approvals
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
];

// ERC1155 ABI for approvals
const ERC1155_ABI = [
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
];

/**
 * Creates a Polymarket CLOB client with the given wallet
 */
export function createClobClient(
  wallet: ethers.Wallet,
  creds?: ApiCredentials
): ClobClient {
  // Transform our ApiCredentials to ClobClient's expected format
  const apiKeyCreds = creds
    ? {
        key: creds.apiKey,
        secret: creds.secret,
        passphrase: creds.passphrase,
      }
    : undefined;

  const client = new ClobClient(
    CLOB_URL,
    CHAIN_ID,
    wallet,
    apiKeyCreds,
    0, // SignatureType: 0 = EOA
    wallet.address // funder address
  );
  return client;
}

/**
 * Derives or creates API credentials for a wallet
 */
export async function deriveApiCredentials(
  wallet: ethers.Wallet
): Promise<ApiCredentials> {
  const client = createClobClient(wallet);
  const creds = await client.createOrDeriveApiKey();
  return {
    apiKey: creds.key,
    secret: creds.secret,
    passphrase: creds.passphrase,
  };
}

/**
 * Fetches events from the Gamma API
 */
export async function fetchEvents(params?: {
  active?: boolean;
  closed?: boolean;
  limit?: number;
  offset?: number;
  tag_slug?: string;
}): Promise<GammaEvent[]> {
  const searchParams = new URLSearchParams();
  if (params?.active !== undefined) searchParams.set('active', String(params.active));
  if (params?.closed !== undefined) searchParams.set('closed', String(params.closed));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));
  if (params?.tag_slug) searchParams.set('tag_slug', params.tag_slug);

  const response = await fetch(`${GAMMA_URL}/events?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetches a single event by slug
 */
export async function fetchEventBySlug(slug: string): Promise<GammaEvent | null> {
  const response = await fetch(`${GAMMA_URL}/events?slug=${slug}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch event: ${response.statusText}`);
  }
  const events = await response.json();
  return events[0] || null;
}

/**
 * Fetches markets from the CLOB API
 */
export async function fetchMarkets(nextCursor?: string): Promise<{
  data: GammaMarket[];
  next_cursor: string;
}> {
  const url = nextCursor
    ? `${CLOB_URL}/markets?next_cursor=${nextCursor}`
    : `${CLOB_URL}/markets`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch markets: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetches order book for a token
 */
export async function fetchOrderBook(tokenId: string): Promise<OrderBook> {
  const response = await fetch(`${CLOB_URL}/book?token_id=${tokenId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch order book: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetches spread for a token
 */
export async function fetchSpread(tokenId: string): Promise<Spread> {
  const response = await fetch(`${CLOB_URL}/spread?token_id=${tokenId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch spread: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetches user positions from the Data API
 */
export async function fetchPositions(userAddress: string): Promise<Position[]> {
  const response = await fetch(
    `${DATA_URL}/positions?user=${userAddress}&sizeThreshold=0`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch positions: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetches user trades from the Data API
 */
export async function fetchTrades(
  userAddress: string,
  limit = 100
): Promise<Trade[]> {
  const response = await fetch(
    `${DATA_URL}/trades?user=${userAddress}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Creates and posts an order
 */
export async function createOrder(
  client: ClobClient,
  params: CreateOrderParams,
  market: GammaMarket
): Promise<OrderResponse> {
  try {
    const order = await client.createOrder({
      tokenID: params.tokenId,
      price: params.price,
      side: params.side === 'BUY' ? Side.BUY : Side.SELL,
      size: params.size,
      feeRateBps: 0,
      nonce: 0,
      expiration: params.expiration,
    });

    const orderType = params.orderType
      ? ClobOrderType[params.orderType as keyof typeof ClobOrderType]
      : ClobOrderType.GTC;
    const response = await client.postOrder(order, orderType);
    return {
      success: response.success,
      errorMsg: response.errorMsg,
      orderId: response.orderID,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancels an order
 */
export async function cancelOrder(
  client: ClobClient,
  orderId: string
): Promise<{ success: boolean; errorMsg?: string }> {
  try {
    const response = await client.cancelOrder({ orderID: orderId });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetches active orders for a market
 */
export async function fetchActiveOrders(
  client: ClobClient,
  market?: string
): Promise<Order[]> {
  try {
    const orders = await client.getOpenOrders({ market });
    // Map OpenOrder from clob-client to our Order type
    return orders.map((o) => ({
      id: o.id,
      market: o.market,
      asset_id: o.asset_id,
      side: o.side as 'BUY' | 'SELL',
      price: o.price,
      original_size: o.original_size,
      size_matched: o.size_matched,
      outcome: o.outcome,
      owner: o.owner,
      created_at: o.created_at,
      expiration: parseInt(o.expiration),
      status: o.status as Order['status'],
      order_type: o.order_type as Order['order_type'],
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

/**
 * Checks if allowances are set for a wallet
 */
export async function checkAllowances(
  wallet: ethers.Wallet
): Promise<{ ctf: boolean; usdc: boolean }> {
  const provider = wallet.provider;
  if (!provider) {
    throw new Error('Wallet not connected to provider');
  }

  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
  const ctf = new ethers.Contract(CTF_ADDRESS, ERC1155_ABI, provider);

  // Check USDC allowance for CTF Exchange
  const usdcAllowance = await usdc.allowance(wallet.address, CTF_EXCHANGE);
  const usdcApproved = BigInt(usdcAllowance) > BigInt(0);

  // Check CTF approval
  const ctfApproved = await ctf.isApprovedForAll(wallet.address, CTF_EXCHANGE);

  return { ctf: ctfApproved, usdc: usdcApproved };
}

/**
 * Sets all required allowances for trading
 */
export async function setAllowances(
  wallet: ethers.Wallet
): Promise<{ success: boolean; txHashes: string[] }> {
  const txHashes: string[] = [];

  try {
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);
    const ctf = new ethers.Contract(CTF_ADDRESS, ERC1155_ABI, wallet);

    // Approve USDC for all exchanges
    const exchanges = [CTF_EXCHANGE, NEG_RISK_CTF_EXCHANGE, NEG_RISK_ADAPTER];

    for (const exchange of exchanges) {
      // USDC approval
      const usdcAllowance = await usdc.allowance(wallet.address, exchange);
      if (BigInt(usdcAllowance) === BigInt(0)) {
        const tx = await usdc.approve(exchange, ethers.constants.MaxUint256);
        await tx.wait();
        txHashes.push(tx.hash);
      }

      // CTF approval
      const ctfApproved = await ctf.isApprovedForAll(wallet.address, exchange);
      if (!ctfApproved) {
        const tx = await ctf.setApprovalForAll(exchange, true);
        await tx.wait();
        txHashes.push(tx.hash);
      }
    }

    return { success: true, txHashes };
  } catch (error) {
    console.error('Error setting allowances:', error);
    return { success: false, txHashes };
  }
}

/**
 * Gets the USDC balance for a wallet
 */
export async function getUsdcBalance(wallet: ethers.Wallet): Promise<string> {
  const provider = wallet.provider;
  if (!provider) return '0';

  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
  const balance = await usdc.balanceOf(wallet.address);
  // USDC has 6 decimals
  return ethers.utils.formatUnits(balance, 6);
}

/**
 * Gets the POL balance for a wallet
 */
export async function getPolBalance(wallet: ethers.Wallet): Promise<string> {
  const provider = wallet.provider;
  if (!provider) return '0';

  const balance = await provider.getBalance(wallet.address);
  return ethers.utils.formatEther(balance);
}

/**
 * Price history data point
 */
export interface PriceHistoryPoint {
  t: number; // timestamp in seconds
  p: number; // price (0-1)
}

export type PriceHistoryInterval = 'max' | '1w' | '1d' | '6h' | '1h';

// Minimum fidelity values required by Polymarket API for each interval
const INTERVAL_FIDELITY: Record<PriceHistoryInterval, number> = {
  '1h': 1,
  '6h': 1,
  '1d': 5,
  '1w': 60,
  'max': 60,
};

/**
 * Fetches price history for a token
 */
export async function fetchPriceHistory(
  tokenId: string,
  interval: PriceHistoryInterval = '1w',
  fidelity?: number
): Promise<PriceHistoryPoint[]> {
  const params = new URLSearchParams();
  params.set('market', tokenId);
  params.set('interval', interval);
  // Use provided fidelity or default based on interval
  params.set('fidelity', String(fidelity || INTERVAL_FIDELITY[interval]));

  const response = await fetch(`${CLOB_URL}/prices-history?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch price history: ${response.statusText}`);
  }
  const data = await response.json();
  return data.history || [];
}
