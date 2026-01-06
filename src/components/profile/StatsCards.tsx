'use client';

import { formatCurrency, formatProfitLoss } from '@/lib/utils';

interface StatsCardsProps {
  totalProfitLoss: number;
  totalGamesPlayed: number;
  winningGames: number;
  totalBuyIns: number;
}

export function StatsCards({ 
  totalProfitLoss, 
  totalGamesPlayed, 
  winningGames,
  totalBuyIns 
}: StatsCardsProps) {
  const winRate = totalGamesPlayed > 0 
    ? Math.round((winningGames / totalGamesPlayed) * 100) 
    : 0;
  
  const avgBuyIn = totalGamesPlayed > 0 
    ? totalBuyIns / totalGamesPlayed 
    : 0;

  const stats = [
    {
      label: 'Total Profit/Loss',
      value: formatProfitLoss(totalProfitLoss),
      color: totalProfitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgGradient: totalProfitLoss >= 0 
        ? 'from-emerald-500/10 to-emerald-600/5' 
        : 'from-red-500/10 to-red-600/5',
    },
    {
      label: 'Games Played',
      value: totalGamesPlayed.toString(),
      color: 'text-slate-900 dark:text-white',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      bgGradient: 'from-blue-500/10 to-blue-600/5',
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      subValue: `${winningGames} winning sessions`,
      color: winRate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      bgGradient: winRate >= 50 ? 'from-emerald-500/10 to-emerald-600/5' : 'from-amber-500/10 to-amber-600/5',
    },
    {
      label: 'Avg Buy-in',
      value: formatCurrency(avgBuyIn),
      color: 'text-slate-900 dark:text-white',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgGradient: 'from-purple-500/10 to-purple-600/5',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`} />
          
          <div className="relative">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              {stat.icon}
              <span className="text-xs font-medium uppercase tracking-wide">{stat.label}</span>
            </div>
            
            <p className={`mt-2 text-2xl font-bold ${stat.color} sm:text-3xl`}>
              {stat.value}
            </p>
            
            {stat.subValue && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {stat.subValue}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

