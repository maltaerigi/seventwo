'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { ParticipantWithLedger } from '@/types';

interface ParticipantCardProps {
  participant: ParticipantWithLedger;
  isHost: boolean;
  eventStatus: 'upcoming' | 'active' | 'completed';
  onBuyIn: (participantId: string) => void;
  onCashOut: (participantId: string) => void;
}

export function ParticipantCard({
  participant,
  isHost,
  eventStatus,
  onBuyIn,
  onCashOut,
}: ParticipantCardProps) {
  const totalBuyIn = participant.buy_in_amount || 0;
  const cashOut = participant.cash_out_amount;
  const hasCashedOut = cashOut !== null;
  const profitLoss = participant.net_profit_loss || 0;
  const rebuyCount = participant.buy_in_ledger?.filter(e => e.is_rebuy).length || 0;

  // Status badge
  const getStatusBadge = () => {
    if (hasCashedOut) {
      return (
        <Badge variant="secondary" className="bg-slate-500 text-white">
          Cashed Out
        </Badge>
      );
    }
    if (totalBuyIn > 0) {
      return (
        <Badge variant="default" className="bg-green-500 text-white">
          Playing
        </Badge>
      );
    }
    if (participant.status === 'checked_in') {
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-500">
          Checked In
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-slate-500">
        {participant.status}
      </Badge>
    );
  };

  return (
    <div className={`rounded-lg border p-4 transition-colors ${
      hasCashedOut 
        ? 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50' 
        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
    }`}>
      <div className="flex items-start justify-between">
        {/* Player Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white">
            {participant.profile.display_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              {participant.profile.display_name || 'Anonymous'}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Money Info */}
        <div className="text-right">
          {totalBuyIn > 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Buy-in: {formatCurrency(totalBuyIn)}
              {rebuyCount > 0 && (
                <span className="ml-1 text-xs text-slate-400">
                  (+{rebuyCount} rebuy{rebuyCount > 1 ? 's' : ''})
                </span>
              )}
            </p>
          )}
          {hasCashedOut && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Cash-out: {formatCurrency(cashOut)}
              </p>
              <p className={`font-semibold ${
                profitLoss > 0 
                  ? 'text-green-600' 
                  : profitLoss < 0 
                  ? 'text-red-600' 
                  : 'text-slate-600'
              }`}>
                {profitLoss > 0 ? '+' : ''}{formatCurrency(profitLoss)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Host Actions */}
      {isHost && eventStatus === 'active' && !hasCashedOut && (
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBuyIn(participant.id)}
            className="flex-1"
          >
            {totalBuyIn > 0 ? '+ Rebuy' : '+ Buy-in'}
          </Button>
          {totalBuyIn > 0 && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onCashOut(participant.id)}
              className="flex-1 bg-amber-500 text-slate-900 hover:bg-amber-400"
            >
              Cash Out
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

