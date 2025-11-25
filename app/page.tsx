'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import {
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Wallet,
  Globe,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  // If user is already logged in, redirect to markets
  useEffect(() => {
    if (!loading && user) {
      router.push('/markets');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">PolyTerm</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary mb-8">
            <Zap className="w-4 h-4" />
            <span>Real-time Polymarket trading</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Trade Prediction Markets
            <span className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Like a Pro
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The fastest, most intuitive terminal for trading on Polymarket.
            Your own wallet, real-time data, and pro trading tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-semibold text-lg group"
            >
              Start Trading Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all font-semibold text-lg"
            >
              I Have an Account
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">1000+</div>
              <div className="text-muted-foreground mt-1">Active Markets</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">$2B+</div>
              <div className="text-muted-foreground mt-1">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">24/7</div>
              <div className="text-muted-foreground mt-1">Trading</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Trade
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Professional-grade tools built for prediction market traders
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Wallet className="w-6 h-6" />}
              title="Your Own Wallet"
              description="We create a secure Polygon wallet just for you. Your keys, your coins, your control."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Real-Time Orderbook"
              description="Live WebSocket updates for instant market data. See every bid and ask as it happens."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Instant Execution"
              description="Place market and limit orders with one click. GTC, FOK, and more order types."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Bank-Grade Security"
              description="Private keys encrypted with AES-256. Never stored in plain text, ever."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Portfolio Tracking"
              description="Track all your positions, P&L, and trade history in one beautiful dashboard."
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="All Markets Access"
              description="Trade any market on Polymarket. Politics, sports, crypto, entertainment, and more."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started in 60 Seconds
            </h2>
            <p className="text-muted-foreground text-lg">
              From signup to your first trade in under a minute
            </p>
          </div>

          <div className="space-y-8">
            <StepCard
              number={1}
              title="Create Your Account"
              description="Sign up with your email. We'll create a secure Polygon wallet automatically."
            />
            <StepCard
              number={2}
              title="Fund Your Wallet"
              description="Deposit USDC (on Polygon) to your wallet address. Need POL for gas? A tiny amount works."
            />
            <StepCard
              number={3}
              title="Start Trading"
              description="Browse markets, check the orderbook, and place your first trade. It's that simple."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 rounded-3xl p-12 text-center border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Trade?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Join thousands of traders using PolyTerm to trade prediction markets.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-semibold text-lg group"
            >
              Create Free Account
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">PolyTerm</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Not affiliated with Polymarket. Trade at your own risk.
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a
                href="https://polymarket.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Polymarket
              </a>
              <a
                href="https://polygon.technology"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Polygon
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-6 items-start">
      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
        {number}
      </div>
      <div className="pt-2">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
