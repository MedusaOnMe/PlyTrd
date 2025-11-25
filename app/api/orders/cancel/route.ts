import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { getUserById } from '@/lib/firebase-admin';
import { getConnectedWallet, decryptPolymarketCreds } from '@/lib/wallet/generate';
import { createClobClient, cancelOrder } from '@/lib/polymarket/client';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { orderId, orderIds } = body as {
      orderId?: string;
      orderIds?: string[];
    };

    if (!orderId && !orderIds?.length) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      );
    }

    const userData = await getUserById(user.uid);
    if (!userData?.wallet || !userData?.polymarketCreds) {
      return NextResponse.json(
        { error: 'Wallet or credentials not found' },
        { status: 404 }
      );
    }

    const wallet = getConnectedWallet({
      address: userData.wallet.address,
      encryptedPrivateKey: userData.wallet.encryptedPrivateKey,
      iv: userData.wallet.iv,
      salt: userData.wallet.salt,
      tag: '',
    });

    const apiCreds = decryptPolymarketCreds(
      userData.polymarketCreds.encryptedApiKey,
      userData.polymarketCreds.encryptedSecret,
      userData.polymarketCreds.encryptedPassphrase
    );

    const client = createClobClient(wallet, apiCreds);

    // Cancel single or multiple orders
    const idsToCancel = orderIds || [orderId!];
    const results = await Promise.all(
      idsToCancel.map((id) => cancelOrder(client, id))
    );

    const canceled = idsToCancel.filter((_, i) => results[i].success);
    const failed = idsToCancel.filter((_, i) => !results[i].success);

    return NextResponse.json({
      success: failed.length === 0,
      canceled,
      failed,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
