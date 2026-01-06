'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import type { Debt } from '@/types/api';

interface SettlementViewProps {
  eventId: string;
  isHost: boolean;
  eventStatus: 'upcoming' | 'active' | 'completed';
  onSettled?: () => void;
}

interface SettlementPreview {
  can_settle: boolean;
  reason?: string;
  preview_debts: Debt[];
  total_pot: number;
}

export function SettlementView({ 
  eventId, 
  isHost, 
  eventStatus,
  onSettled 
}: SettlementViewProps) {
  const [preview, setPreview] = useState<SettlementPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  const loadPreview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/settle`);
      const data = await response.json();
      
      if (data.success) {
        setPreview(data.data);
      } else {
        toast.error(data.error?.message || 'Failed to load settlement preview');
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load settlement preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettle = async () => {
    if (!confirm('Are you sure you want to settle this game? This action cannot be undone.')) {
      return;
    }

    setIsSettling(true);
    try {
      const response = await fetch(`/api/events/${eventId}/settle`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Game settled successfully!');
        onSettled?.();
      } else {
        toast.error(data.error?.message || 'Failed to settle game');
      }
    } catch (error) {
      console.error('Error settling:', error);
      toast.error('Failed to settle game');
    } finally {
      setIsSettling(false);
    }
  };

  // Already completed - show final debts
  if (eventStatus === 'completed') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <h3 className="font-semibold text-green-800 dark:text-green-400">
            Game Settled
          </h3>
        </div>
        <p className="mt-2 text-sm text-green-700 dark:text-green-500">
          This game has been completed and all debts have been calculated.
        </p>
      </div>
    );
  }

  // Not active yet
  if (eventStatus !== 'active') {
    return null;
  }

  // Show preview button if not loaded
  if (!preview) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white">
          🏁 Ready to Settle?
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Preview who owes whom before finalizing the game.
        </p>
        {isHost && (
          <Button
            className="mt-4 w-full"
            onClick={loadPreview}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Preview Settlement'}
          </Button>
        )}
      </div>
    );
  }

  // Show preview
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="font-semibold text-slate-900 dark:text-white">
        📊 Settlement Preview
      </h3>
      
      {!preview.can_settle ? (
        // Cannot settle
        <div className="mt-4">
          <div className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            <p className="font-medium">Cannot settle yet</p>
            <p className="text-sm">{preview.reason}</p>
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={loadPreview}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      ) : (
        // Can settle - show debts
        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Pot</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(preview.total_pot)}
            </p>
          </div>

          {preview.preview_debts.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Settlements ({preview.preview_debts.length}):
              </p>
              {preview.preview_debts.map((debt, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">👤 {debt.from_user_name}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-green-500">👤 {debt.to_user_name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(debt.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Everyone broke even! No settlements needed.
            </p>
          )}

          {isHost && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={loadPreview}
                disabled={isLoading || isSettling}
              >
                Refresh
              </Button>
              <Button
                className="flex-1 bg-green-600 text-white hover:bg-green-500"
                onClick={handleSettle}
                disabled={isSettling}
              >
                {isSettling ? 'Settling...' : 'Confirm & Settle'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

