'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import type { ParticipantWithLedger } from '@/types';

interface CashOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant: ParticipantWithLedger | null;
  eventId: string;
  onSuccess: () => void;
}

export function CashOutModal({
  open,
  onOpenChange,
  participant,
  eventId,
  onSuccess,
}: CashOutModalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const buyInAmount = participant?.buy_in_amount || 0;

  // Reset amount when participant changes
  useEffect(() => {
    if (participant) {
      setAmount(buyInAmount.toString());
    }
  }, [participant, buyInAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!participant) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/cash-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participant.id,
          amount: numAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to record cash-out');
      }

      const profitLoss = numAmount - buyInAmount;
      const profitLossText = profitLoss >= 0 
        ? `+${formatCurrency(profitLoss)}` 
        : formatCurrency(profitLoss);

      toast.success(
        `Cash-out recorded! ${participant.profile.display_name}: ${profitLossText}`
      );
      
      // Show warnings if any
      if (data.data?.validation_warnings?.length > 0) {
        data.data.validation_warnings.forEach((warning: string) => {
          toast.warning(warning);
        });
      }

      onSuccess();
      onOpenChange(false);
      setAmount('');
    } catch (error) {
      console.error('Cash-out error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to record cash-out');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate projected profit/loss
  const numAmount = parseFloat(amount) || 0;
  const projectedProfitLoss = numAmount - buyInAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Cash-Out</DialogTitle>
          <DialogDescription>
            {participant?.profile.display_name || 'Player'} — 
            Total Buy-in: {formatCurrency(buyInAmount)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Amount Input */}
            <div>
              <Label htmlFor="cashout-amount">Cash-Out Amount</Label>
              <div className="mt-1.5 flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-100 px-3 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  $
                </span>
                <Input
                  id="cashout-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-l-none"
                  placeholder="0.00"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Profit/Loss Preview */}
            {amount && (
              <div className={`rounded-lg p-4 ${
                projectedProfitLoss > 0 
                  ? 'bg-green-50 dark:bg-green-900/20' 
                  : projectedProfitLoss < 0 
                  ? 'bg-red-50 dark:bg-red-900/20' 
                  : 'bg-slate-50 dark:bg-slate-800'
              }`}>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Net Profit/Loss:
                </p>
                <p className={`text-2xl font-bold ${
                  projectedProfitLoss > 0 
                    ? 'text-green-600' 
                    : projectedProfitLoss < 0 
                    ? 'text-red-600' 
                    : 'text-slate-600'
                }`}>
                  {projectedProfitLoss >= 0 ? '+' : ''}{formatCurrency(projectedProfitLoss)}
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAmount('0')}
                disabled={isLoading}
              >
                Bust ($0)
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAmount(buyInAmount.toString())}
                disabled={isLoading}
              >
                Break Even
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setAmount((buyInAmount * 2).toString())}
                disabled={isLoading}
              >
                Double Up
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !amount}
              className="bg-amber-500 text-slate-900 hover:bg-amber-400"
            >
              {isLoading ? 'Recording...' : 'Record Cash-Out'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

