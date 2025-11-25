import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { getUserById, updateUser } from '@/lib/firebase-admin';
import { getConnectedWallet, decryptPolymarketCreds, encryptPolymarketCreds } from '@/lib/wallet/generate';
import {
  createClobClient,
  deriveApiCredentials,
  createOrder,
  setAllowances,
  checkAllowances,
} from '@/lib/polymarket/client';
import { CreateOrderParams, GammaMarket } from '@/lib/polymarket/types';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { tokenId, price, size, side, orderType, market } = body as {
      tokenId: string;
      price: number;
      size: number;
      side: 'BUY' | 'SELL';
      orderType?: 'GTC' | 'GTD' | 'FOK' | 'FAK';
      market: GammaMarket;
    };

    // Validate inputs
    if (!tokenId || price === undefined || !size || !side) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userData = await getUserById(user.uid);
    if (!userData?.wallet) {
      return NextResponse.json(
        { error: 'No wallet found' },
        { status: 404 }
      );
    }

    // Get connected wallet
    const wallet = getConnectedWallet({
      address: userData.wallet.address,
      encryptedPrivateKey: userData.wallet.encryptedPrivateKey,
      iv: userData.wallet.iv,
      salt: userData.wallet.salt,
      tag: userData.wallet.tag,
    });

    // Check and set allowances if needed
    const allowances = await checkAllowances(wallet);
    if (!allowances.ctf || !allowances.usdc) {
      const allowanceResult = await setAllowances(wallet);
      if (!allowanceResult.success) {
        return NextResponse.json(
          { error: 'Failed to set allowances. Make sure you have POL for gas.' },
          { status: 400 }
        );
      }
      await updateUser(user.uid, { allowancesSet: true });
    }

    // Get or derive API credentials
    let apiCreds;
    if (userData.polymarketCreds) {
      apiCreds = decryptPolymarketCreds(
        userData.polymarketCreds.encryptedApiKey,
        userData.polymarketCreds.encryptedSecret,
        userData.polymarketCreds.encryptedPassphrase
      );
    } else {
      // Derive credentials
      apiCreds = await deriveApiCredentials(wallet);

      // Store encrypted credentials
      const encryptedCreds = encryptPolymarketCreds(
        apiCreds.apiKey,
        apiCreds.secret,
        apiCreds.passphrase
      );
      await updateUser(user.uid, { polymarketCreds: encryptedCreds });
    }

    // Create CLOB client with credentials
    const client = createClobClient(wallet, apiCreds);

    // Create and post order
    const orderParams: CreateOrderParams = {
      tokenId,
      price,
      size,
      side,
      orderType,
    };

    const result = await createOrder(client, orderParams, market);

    if (!result.success) {
      return NextResponse.json(
        { error: result.errorMsg || 'Failed to create order' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      status: result.status,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// Get active orders
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || undefined;

    const userData = await getUserById(user.uid);
    if (!userData?.wallet || !userData?.polymarketCreds) {
      return NextResponse.json({ orders: [] });
    }

    const wallet = getConnectedWallet({
      address: userData.wallet.address,
      encryptedPrivateKey: userData.wallet.encryptedPrivateKey,
      iv: userData.wallet.iv,
      salt: userData.wallet.salt,
      tag: userData.wallet.tag,
    });

    const apiCreds = decryptPolymarketCreds(
      userData.polymarketCreds.encryptedApiKey,
      userData.polymarketCreds.encryptedSecret,
      userData.polymarketCreds.encryptedPassphrase
    );

    const client = createClobClient(wallet, apiCreds);
    const orders = await client.getOpenOrders({ market });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to get orders' },
      { status: 500 }
    );
  }
}
