import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { getUserById } from '@/lib/firebase-admin';
import { decryptWallet, getConnectedWallet } from '@/lib/wallet/generate';
import { getUsdcBalance, getPolBalance } from '@/lib/polymarket/client';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Get user data
    const userData = await getUserById(user.uid);
    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let usdcBalance = '0';
    let polBalance = '0';

    // If wallet exists, fetch balances
    if (userData.wallet) {
      try {
        const wallet = getConnectedWallet({
          address: userData.wallet.address,
          encryptedPrivateKey: userData.wallet.encryptedPrivateKey,
          iv: userData.wallet.iv,
          salt: userData.wallet.salt,
          tag: userData.wallet.tag,
        });

        usdcBalance = await getUsdcBalance(wallet);
        polBalance = await getPolBalance(wallet);
      } catch (error) {
        console.error('Error fetching balances:', error);
        // Continue with zero balances
      }
    }

    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      walletAddress: userData.wallet?.address || null,
      usdcBalance,
      polBalance,
      allowancesSet: userData.allowancesSet || false,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    );
  }
}
