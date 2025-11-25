'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Ticker } from '@/components/terminal/Ticker';
import { StatusBar } from '@/components/terminal/StatusBar';
import { useGlobalHotkeys } from '@/hooks/useHotkeys';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  // Initialize global hotkeys
  useGlobalHotkeys();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <Header />

      {/* Ticker Bar - below header */}
      <div className="fixed top-16 left-0 right-0 z-40">
        <Ticker />
      </div>

      {/* Main content - with padding for header, ticker, and status bar */}
      <main className="flex-1 pt-24 pb-8">{children}</main>

      {/* Fixed Status Bar */}
      <StatusBar />
    </div>
  );
}
