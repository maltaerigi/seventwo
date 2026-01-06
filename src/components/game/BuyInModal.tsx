'use client';

import { useState } from 'react';
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

interface BuyInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant: ParticipantWithLedger | null;
  eventId: string;
  defaultAmount?: number;
  onSuccess: () => void;
}

export function BuyInModal({
  open,
  onOpenChange,
  participant,
  eventId,
  defaultAmount = 100,
  onSuccess,
}: BuyInModalProps) {
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentBuyIn = participant?.buy_in_amount || 0;
  const isRebuy = currentBuyIn > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!participant) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/buy-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participant.id,
          amount: numAmount,
          is_rebuy: isRebuy,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to record buy-in');
      }

      toast.success(
        isRebuy 
          ? `Rebuy of ${formatCurrency(numAmount)} recorded!` 
          : `Buy-in of ${formatCurrency(numAmount)} recorded!`
      );
      
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setAmount(defaultAmount.toString());
      setNotes('');
    } catch (error) {
      console.error('Buy-in error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to record buy-in');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick amount buttons
  const quickAmounts = [20, 50, 100, 200];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRebuy ? 'Record Rebuy' : 'Record Buy-in'}
          </DialogTitle>
          <DialogDescription>
            {participant?.profile.display_name || 'Player'}
            {isRebuy && (
              <span className="ml-2 text-amber-600">
                (Current: {formatCurrency(currentBuyIn)})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Amount Input */}
            <div>
              <Label htmlFor="amount">Amount</Label>
              <div className="mt-1.5 flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-100 px-3 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-l-none"
                  placeholder="100.00"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              {quickAmounts.map((qa) => (
                <Button
                  key={qa}
                  type="button"
                  size="sm"
                  variant={amount === qa.toString() ? 'default' : 'outline'}
                  onClick={() => setAmount(qa.toString())}
                  disabled={isLoading}
                >
                  ${qa}
                </Button>
              ))}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5"
                placeholder={isRebuy ? 'e.g., Second rebuy' : 'e.g., Paid cash'}
                disabled={isLoading}
              />
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
              disabled={isLoading}
              className="bg-amber-500 text-slate-900 hover:bg-amber-400"
            >
              {isLoading ? 'Recording...' : isRebuy ? 'Record Rebuy' : 'Record Buy-in'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

