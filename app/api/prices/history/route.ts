import { NextRequest, NextResponse } from 'next/server';
import { fetchPriceHistory, PriceHistoryInterval } from '@/lib/polymarket/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const interval = (searchParams.get('interval') || '1w') as PriceHistoryInterval;
    const fidelity = searchParams.get('fidelity')
      ? parseInt(searchParams.get('fidelity')!)
      : undefined;

    if (!tokenId) {
      return NextResponse.json(
        { error: 'tokenId is required' },
        { status: 400 }
      );
    }

    const history = await fetchPriceHistory(tokenId, interval, fidelity);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Price history fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    );
  }
}
