'use client';

import Link from 'next/link';
import { formatCurrency, formatProfitLoss, getRelativeTime } from '@/lib/utils';
import { ROUTES } from '@/constants';
import type { UserGameResult } from '@/types';

interface RecentActivityProps {
  gameResults: UserGameResult[];
  limit?: number;
}

export function RecentActivity({ gameResults, limit = 5 }: RecentActivityProps) {
  // Sort by date descending and take the most recent
  const recentGames = [...gameResults]
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
    .slice(0, limit);

  if (recentGames.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Recent Activity
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No recent activity yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Recent Activity
        </h3>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {recentGames.map((game, index) => {
          const isWin = game.net_profit_loss > 0;
          const isLoss = game.net_profit_loss < 0;
          const isPlaying = game.cash_out_amount === null;

          return (
            <Link
              key={`${game.event_id}-${index}`}
              href={ROUTES.EVENT_DETAIL(game.event_id)}
              className="group flex items-start gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:px-6"
            >
              {/* Activity icon */}
              <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                isPlaying
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : isWin
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : isLoss
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {isPlaying ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : isWin ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ) : isLoss ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                      {game.event_title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {isPlaying ? (
                        <span className="flex items-center gap-1">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                          </span>
                          Currently playing • {formatCurrency(game.buy_in_amount)} buy-in
                        </span>
                      ) : (
                        <>
                          {getRelativeTime(game.event_date)} • {formatCurrency(game.buy_in_amount)} buy-in
                        </>
                      )}
                    </p>
                  </div>

                  {/* Result */}
                  <div className="flex-shrink-0 text-right">
                    {!isPlaying && (
                      <span className={`text-sm font-semibold ${
                        isWin
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isLoss
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {formatProfitLoss(game.net_profit_loss)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <svg 
                className="h-5 w-5 flex-shrink-0 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>

      {/* View all link */}
      {gameResults.length > limit && (
        <div className="border-t border-slate-200 px-4 py-3 text-center dark:border-slate-800 sm:px-6">
          <button 
            className="text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            onClick={(e) => {
              e.preventDefault();
              // Scroll to game history section
              document.getElementById('game-history')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            View all {gameResults.length} games →
          </button>
        </div>
      )}
    </div>
  );
}

