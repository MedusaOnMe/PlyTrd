'use client';

import { WatchlistWidget } from '@/components/dashboard/WatchlistWidget';
import { MoversWidget } from '@/components/dashboard/MoversWidget';
import { PositionsWidget } from '@/components/dashboard/PositionsWidget';
import { EndingSoonWidget } from '@/components/dashboard/EndingSoonWidget';
import { Activity, BarChart3, Clock, Star } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-mono">DASHBOARD</h1>
          <p className="text-xs text-muted-foreground">Trading overview and watchlist</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/markets"
            className="btn btn-secondary text-xs"
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            Browse Markets
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Watchlist - Left column */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="h-[400px]">
            <WatchlistWidget />
          </div>
        </div>

        {/* Center column - Movers and Ending Soon stacked */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-5 space-y-4">
          <div className="h-[190px]">
            <MoversWidget />
          </div>
          <div className="h-[190px]">
            <EndingSoonWidget />
          </div>
        </div>

        {/* Right column - Positions */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-4">
          <div className="h-[400px]">
            <PositionsWidget />
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Watchlist Items"
          value="--"
          icon={<Star className="w-4 h-4 text-yellow-500" />}
        />
        <StatCard
          label="Active Positions"
          value="--"
          icon={<Activity className="w-4 h-4 text-success" />}
        />
        <StatCard
          label="Markets Ending Today"
          value="--"
          icon={<Clock className="w-4 h-4 text-warning" />}
        />
        <StatCard
          label="24h Volume"
          value="--"
          icon={<BarChart3 className="w-4 h-4 text-primary" />}
        />
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="panel p-3">
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Keyboard Shortcuts:</span>
          <div className="flex items-center gap-1">
            <kbd className="kbd">/</kbd>
            <span>Search markets</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="kbd">G</kbd>
            <kbd className="kbd">H</kbd>
            <span>Go to Dashboard</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="kbd">G</kbd>
            <kbd className="kbd">M</kbd>
            <span>Go to Markets</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="kbd">G</kbd>
            <kbd className="kbd">P</kbd>
            <span>Go to Portfolio</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="panel p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-lg font-mono font-bold">{value}</div>
    </div>
  );
}
