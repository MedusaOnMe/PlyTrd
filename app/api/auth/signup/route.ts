import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import { adminDb, createUser } from '@/lib/firebase-admin';
import { createEncryptedWallet } from '@/lib/wallet/generate';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Check if user already exists
    const existingUser = await adminDb.collection('users').doc(user.uid).get();
    if (existingUser.exists && existingUser.data()?.wallet) {
      return NextResponse.json(
        { error: 'User already has a wallet' },
        { status: 400 }
      );
    }

    // Create encrypted wallet
    const encryptedWallet = createEncryptedWallet();

    // Store user data with encrypted wallet
    // API credentials will be derived on first trade
    await createUser(user.uid, {
      id: user.uid,
      email: user.email,
      wallet: {
        address: encryptedWallet.address,
        encryptedPrivateKey: encryptedWallet.encryptedPrivateKey,
        iv: encryptedWallet.iv,
        salt: encryptedWallet.salt,
        tag: encryptedWallet.tag,
      },
      allowancesSet: false,
    });

    return NextResponse.json({
      success: true,
      walletAddress: encryptedWallet.address,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
