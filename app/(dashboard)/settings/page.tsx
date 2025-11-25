'use client';

import { useAuthStore, useToastStore } from '@/lib/store';
import { signOut } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import {
  User,
  Wallet,
  Copy,
  ExternalLink,
  LogOut,
  AlertTriangle,
  Key,
  Shield,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, walletAddress, usdcBalance, polBalance } = useAuthStore();
  const { addToast } = useToastStore();

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      addToast('success', 'Address copied to clipboard');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      addToast('error', 'Failed to sign out');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and wallet</p>
      </div>

      <div className="space-y-6">
        {/* Account */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Account</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">User ID</label>
              <p className="font-mono text-sm">{user?.uid}</p>
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Wallet</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">
                Polygon Address
              </label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono truncate">
                  {walletAddress}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={`https://polygonscan.com/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="View on PolygonScan"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <label className="text-sm text-muted-foreground">
                  USDC Balance
                </label>
                <p className="text-xl font-bold font-mono">
                  ${parseFloat(usdcBalance).toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <label className="text-sm text-muted-foreground">
                  POL Balance
                </label>
                <p className="text-xl font-bold font-mono">
                  {parseFloat(polBalance).toFixed(4)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-primary mb-1">
                    Fund Your Wallet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    To trade on Polymarket, deposit USDC (on Polygon) to your
                    wallet address above. You'll also need a small amount of POL
                    for transaction fees (~0.01 POL per trade).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Security</h2>
          </div>

          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive mb-1">
                  Private Key Security
                </p>
                <p className="text-sm text-muted-foreground">
                  Your private key is encrypted and stored securely. Never share
                  your private key with anyone. For advanced users who need to
                  export their key, please contact support.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
