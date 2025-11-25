import { ethers } from 'ethers';
import { encrypt, decrypt, encryptToString, decryptFromString } from './encrypt';

export interface GeneratedWallet {
  address: string;
  privateKey: string;
}

export interface EncryptedWallet {
  address: string;
  encryptedPrivateKey: string;
  iv: string;
  salt: string;
  tag: string;
}

/**
 * Generates a new Ethereum/Polygon wallet
 */
export function generateWallet(): GeneratedWallet {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Creates and encrypts a new wallet
 */
export function createEncryptedWallet(masterKey?: string): EncryptedWallet {
  const wallet = generateWallet();
  const { encrypted, iv, salt, tag } = encrypt(wallet.privateKey, masterKey);

  return {
    address: wallet.address,
    encryptedPrivateKey: encrypted,
    iv,
    salt,
    tag,
  };
}

/**
 * Decrypts a wallet and returns the ethers.Wallet instance
 */
export function decryptWallet(
  encryptedWallet: EncryptedWallet,
  masterKey?: string
): ethers.Wallet {
  const privateKey = decrypt(
    encryptedWallet.encryptedPrivateKey,
    encryptedWallet.iv,
    encryptedWallet.salt,
    encryptedWallet.tag,
    masterKey
  );

  return new ethers.Wallet(privateKey);
}

/**
 * Gets a wallet instance connected to a provider
 */
export function getConnectedWallet(
  encryptedWallet: EncryptedWallet,
  rpcUrl?: string,
  masterKey?: string
): ethers.Wallet {
  const wallet = decryptWallet(encryptedWallet, masterKey);
  const provider = new ethers.providers.JsonRpcProvider(
    rpcUrl || process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
  );
  return wallet.connect(provider);
}

/**
 * Encrypts Polymarket API credentials
 */
export function encryptPolymarketCreds(
  apiKey: string,
  secret: string,
  passphrase: string,
  masterKey?: string
): {
  encryptedApiKey: string;
  encryptedSecret: string;
  encryptedPassphrase: string;
} {
  return {
    encryptedApiKey: encryptToString(apiKey, masterKey),
    encryptedSecret: encryptToString(secret, masterKey),
    encryptedPassphrase: encryptToString(passphrase, masterKey),
  };
}

/**
 * Decrypts Polymarket API credentials
 */
export function decryptPolymarketCreds(
  encryptedApiKey: string,
  encryptedSecret: string,
  encryptedPassphrase: string,
  masterKey?: string
): {
  apiKey: string;
  secret: string;
  passphrase: string;
} {
  return {
    apiKey: decryptFromString(encryptedApiKey, masterKey),
    secret: decryptFromString(encryptedSecret, masterKey),
    passphrase: decryptFromString(encryptedPassphrase, masterKey),
  };
}
