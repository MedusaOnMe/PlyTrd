'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, useToastStore } from '@/lib/store';
import { signOut } from '@/lib/firebase-client';
import {
  TrendingUp,
  Wallet,
  Settings,
  LogOut,
  User,
  LayoutGrid,
  Copy,
  ExternalLink,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function Header() {
  const pathname = usePathname();
  const { user, walletAddress, usdcBalance, polBalance } = useAuthStore();
  const { addToast } = useToastStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      addToast('info', 'Signed out successfully');
    } catch (error) {
      addToast('error', 'Failed to sign out');
    }
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      addToast('success', 'Address copied to clipboard');
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { href: '/markets', label: 'Markets', icon: TrendingUp },
    { href: '/portfolio', label: 'Portfolio', icon: Wallet },
    { href: '/orders', label: 'Orders', icon: LayoutGrid },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass border-b border-white/5 z-40">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/markets" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-[hsl(200,95%,50%)] rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xl font-bold gradient-text">PolyTerm</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-white/5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet & User */}
        <div className="flex items-center gap-3">
          {/* Balance Display */}
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-muted-foreground">USDC</span>
              <span className="font-mono text-sm font-medium">
                ${parseFloat(usdcBalance).toFixed(2)}
              </span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">POL</span>
              <span className="font-mono text-sm font-medium">
                {parseFloat(polBalance).toFixed(4)}
              </span>
            </div>
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                showMenu
                  ? 'bg-primary/10 ring-1 ring-primary/30'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]">
                {user.email?.split('@')[0]}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  showMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-80 glass rounded-xl shadow-2xl overflow-hidden border border-white/10 animate-slideUp">
                {/* User Info */}
                <div className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-b border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[hsl(200,95%,50%)] flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Connected to Polygon</p>
                    </div>
                  </div>

                  {/* Wallet Address */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <code className="text-xs font-mono truncate flex-1 text-muted-foreground">
                      {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                      title="Copy address"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`https://polygonscan.com/address/${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                      title="View on Polygonscan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Mobile Balance */}
                <div className="lg:hidden p-4 border-b border-white/5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Balances
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-success/10">
                      <p className="text-xs text-success/80 mb-1">USDC</p>
                      <p className="font-mono font-bold text-success">
                        ${parseFloat(usdcBalance).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10">
                      <p className="text-xs text-primary/80 mb-1">POL</p>
                      <p className="font-mono font-bold text-primary">
                        {parseFloat(polBalance).toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden p-2 border-b border-white/5">
                  {navItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMenu(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Sign Out */}
                <div className="p-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
