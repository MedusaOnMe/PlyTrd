import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { getUserById } from '@/lib/firebase-admin';
import { getConnectedWallet } from '@/lib/wallet/generate';
import { getUsdcBalance, getPolBalance } from '@/lib/polymarket/client';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const userData = await getUserById(user.uid);
    if (!userData?.wallet) {
      return NextResponse.json(
        { error: 'No wallet found' },
        { status: 404 }
      );
    }

    const wallet = getConnectedWallet({
      address: userData.wallet.address,
      encryptedPrivateKey: userData.wallet.encryptedPrivateKey,
      iv: userData.wallet.iv,
      salt: userData.wallet.salt,
      tag: userData.wallet.tag,
    });

    const [usdcBalance, polBalance] = await Promise.all([
      getUsdcBalance(wallet),
      getPolBalance(wallet),
    ]);

    return NextResponse.json({
      address: userData.wallet.address,
      usdcBalance,
      polBalance,
    });
  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
