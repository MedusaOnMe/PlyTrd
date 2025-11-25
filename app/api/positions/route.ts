import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { getUserById } from '@/lib/firebase-admin';
import { fetchPositions, fetchTrades } from '@/lib/polymarket/client';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const includeTrades = searchParams.get('trades') === 'true';

    const userData = await getUserById(user.uid);
    if (!userData?.wallet) {
      return NextResponse.json({
        positions: [],
        trades: [],
      });
    }

    const walletAddress = userData.wallet.address;

    // Fetch positions
    const positions = await fetchPositions(walletAddress);

    // Optionally fetch trades
    let trades: any[] = [];
    if (includeTrades) {
      trades = await fetchTrades(walletAddress, 100);
    }

    // Calculate portfolio summary
    const totals = positions.reduce(
      (acc, pos) => {
        acc.totalValue += parseFloat(pos.current_value || '0');
        acc.totalPnl += parseFloat(pos.cash_pnl || '0');
        acc.totalInitial += parseFloat(pos.initial_value || '0');
        return acc;
      },
      { totalValue: 0, totalPnl: 0, totalInitial: 0 }
    );

    const percentPnl =
      totals.totalInitial > 0
        ? ((totals.totalPnl / totals.totalInitial) * 100).toFixed(2)
        : '0';

    return NextResponse.json({
      positions,
      trades,
      summary: {
        totalValue: totals.totalValue.toFixed(2),
        totalPnl: totals.totalPnl.toFixed(2),
        totalInitial: totals.totalInitial.toFixed(2),
        percentPnl,
      },
    });
  } catch (error) {
    console.error('Positions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}
