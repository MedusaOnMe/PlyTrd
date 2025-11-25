import { NextRequest, NextResponse } from 'next/server';
import { fetchEventBySlug, fetchOrderBook, fetchSpread } from '@/lib/polymarket/client';
import { GammaMarket } from '@/lib/polymarket/types';

// Helper to extract tokens from market data
function getMarketTokens(market: GammaMarket): Array<{ token_id: string; outcome: string; price?: number }> {
  // If tokens array exists and has data, use it
  if (market.tokens && market.tokens.length > 0) {
    return market.tokens;
  }

  // Otherwise, construct from clobTokenIds and outcomes
  const tokens: Array<{ token_id: string; outcome: string; price?: number }> = [];

  try {
    const tokenIds = market.clobTokenIds ? JSON.parse(market.clobTokenIds) : [];
    const outcomes = market.outcomes ? JSON.parse(market.outcomes) : ['Yes', 'No'];
    const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : [];

    for (let i = 0; i < tokenIds.length; i++) {
      tokens.push({
        token_id: tokenIds[i],
        outcome: outcomes[i] || `Outcome ${i + 1}`,
        price: prices[i] ? parseFloat(prices[i]) : undefined,
      });
    }
  } catch (e) {
    console.error('Error parsing market token data:', e);
  }

  return tokens;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slug = params.id;

    // Fetch event data
    const event = await fetchEventBySlug(slug);
    if (!event) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    // Normalize tokens for all markets
    const normalizedEvent = {
      ...event,
      markets: event.markets.map((market) => ({
        ...market,
        tokens: getMarketTokens(market),
      })),
    };

    // Fetch order books and spreads for all tokens in the market
    const tokenData = await Promise.all(
      normalizedEvent.markets.flatMap((market) =>
        market.tokens.map(async (token) => {
          try {
            const [orderBook, spread] = await Promise.all([
              fetchOrderBook(token.token_id),
              fetchSpread(token.token_id),
            ]);
            return {
              token_id: token.token_id,
              outcome: token.outcome,
              orderBook,
              spread,
            };
          } catch (error) {
            console.error(`Error fetching data for token ${token.token_id}:`, error);
            return {
              token_id: token.token_id,
              outcome: token.outcome,
              orderBook: null,
              spread: null,
            };
          }
        })
      )
    );

    return NextResponse.json({
      event: normalizedEvent,
      tokenData,
    });
  } catch (error) {
    console.error('Market detail fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market details' },
      { status: 500 }
    );
  }
}
