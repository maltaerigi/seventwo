'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatProfitLoss } from '@/lib/utils';
import { ROUTES } from '@/constants';
import type { UserGameResult } from '@/types';

interface GameHistoryListProps {
  gameResults: UserGameResult[];
}

type SortField = 'date' | 'profit' | 'buyIn';
type SortDirection = 'asc' | 'desc';

export function GameHistoryList({ gameResults }: GameHistoryListProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedResults = [...gameResults].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'date':
        comparison = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        break;
      case 'profit':
        comparison = a.net_profit_loss - b.net_profit_loss;
        break;
      case 'buyIn':
        comparison = a.buy_in_amount - b.buy_in_amount;
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="ml-1 h-4 w-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (gameResults.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <span className="text-3xl">🃏</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No games yet</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Join or create a poker event to start tracking your game history.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Game History
          </h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {gameResults.length} {gameResults.length === 1 ? 'game' : 'games'}
          </span>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Date
                  <SortIcon field="date" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Event
              </th>
              <th className="px-6 py-3 text-right">
                <button
                  onClick={() => handleSort('buyIn')}
                  className="ml-auto flex items-center text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Buy-in
                  <SortIcon field="buyIn" />
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Cash-out
              </th>
              <th className="px-6 py-3 text-right">
                <button
                  onClick={() => handleSort('profit')}
                  className="ml-auto flex items-center text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Net P/L
                  <SortIcon field="profit" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {sortedResults.map((result, index) => (
              <tr 
                key={`${result.event_id}-${index}`}
                className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(result.event_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-4">
                  <Link 
                    href={ROUTES.EVENT_DETAIL(result.event_id)}
                    className="font-medium text-slate-900 hover:text-amber-600 dark:text-white dark:hover:text-amber-400"
                  >
                    {result.event_title}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">
                  {formatCurrency(result.buy_in_amount)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-300">
                  {result.cash_out_amount !== null 
                    ? formatCurrency(result.cash_out_amount) 
                    : <Badge variant="outline" className="text-xs">Playing</Badge>
                  }
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  {result.cash_out_amount !== null ? (
                    <span className={`font-semibold ${
                      result.net_profit_loss >= 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatProfitLoss(result.net_profit_loss)}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800 md:hidden">
        {sortedResults.map((result, index) => (
          <Link
            key={`${result.event_id}-${index}`}
            href={ROUTES.EVENT_DETAIL(result.event_id)}
            className="block p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 dark:text-white">
                  {result.event_title}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(result.event_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              
              <div className="ml-4 text-right">
                {result.cash_out_amount !== null ? (
                  <span className={`text-lg font-semibold ${
                    result.net_profit_loss >= 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatProfitLoss(result.net_profit_loss)}
                  </span>
                ) : (
                  <Badge variant="outline">Playing</Badge>
                )}
              </div>
            </div>
            
            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>Buy-in: {formatCurrency(result.buy_in_amount)}</span>
              {result.cash_out_amount !== null && (
                <span>Cash-out: {formatCurrency(result.cash_out_amount)}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

