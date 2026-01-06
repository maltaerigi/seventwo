'use client';

import { formatCurrency } from '@/lib/utils';
import type { ParticipantWithLedger } from '@/types';

interface EventLedgerProps {
  participants: ParticipantWithLedger[];
  eventStatus: 'upcoming' | 'active' | 'completed';
}

export function EventLedger({ participants, eventStatus }: EventLedgerProps) {
  // Calculate totals
  const totalBuyIns = participants.reduce(
    (sum, p) => sum + (p.buy_in_amount || 0),
    0
  );
  
  const totalCashOuts = participants.reduce(
    (sum, p) => sum + (p.cash_out_amount ?? 0),
    0
  );
  
  const playersWithBuyIn = participants.filter(p => (p.buy_in_amount || 0) > 0);
  const playersCashedOut = participants.filter(p => p.cash_out_amount !== null);
  const playersStillPlaying = playersWithBuyIn.length - playersCashedOut.length;
  
  const moneyInPlay = totalBuyIns - totalCashOuts;
  const isBalanced = Math.abs(moneyInPlay) < 0.01 && playersStillPlaying === 0;

  if (eventStatus === 'upcoming') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white">Game Ledger</h3>
        <p className="mt-2 text-sm text-slate-500">
          Start the game to begin tracking buy-ins and cash-outs.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
        💰 Game Ledger
      </h3>
      
      <div className="space-y-3">
        {/* Total Buy-ins */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Total Buy-ins</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {formatCurrency(totalBuyIns)}
          </span>
        </div>
        
        {/* Total Cash-outs */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Total Cash-outs</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {formatCurrency(totalCashOuts)}
          </span>
        </div>
        
        <hr className="border-slate-200 dark:border-slate-700" />
        
        {/* Money in Play */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            Money in Play
          </span>
          <span className={`text-lg font-bold ${
            moneyInPlay > 0 
              ? 'text-amber-600' 
              : isBalanced 
              ? 'text-green-600' 
              : 'text-slate-600'
          }`}>
            {formatCurrency(moneyInPlay)}
          </span>
        </div>
        
        {/* Player Status */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {playersWithBuyIn.length}
            </p>
            <p className="text-xs text-slate-500">Players</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {playersStillPlaying}
            </p>
            <p className="text-xs text-slate-500">Playing</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {playersCashedOut.length}
            </p>
            <p className="text-xs text-slate-500">Cashed Out</p>
          </div>
        </div>
        
        {/* Balance Status */}
        {eventStatus === 'active' && playersStillPlaying === 0 && playersWithBuyIn.length > 0 && (
          <div className={`mt-2 rounded-lg p-3 text-center text-sm ${
            isBalanced 
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {isBalanced 
              ? '✓ Books are balanced! Ready to settle.' 
              : `⚠️ Discrepancy of ${formatCurrency(Math.abs(moneyInPlay))}`
            }
          </div>
        )}
      </div>
    </div>
  );
}

