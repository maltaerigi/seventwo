'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface GameControlsProps {
  eventId: string;
  eventStatus: 'upcoming' | 'active' | 'completed';
  isHost: boolean;
  onStatusChange: () => void;
}

export function GameControls({
  eventId,
  eventStatus,
  isHost,
  onStatusChange,
}: GameControlsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = async (newStatus: 'active' | 'completed') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update event');
      }

      toast.success(
        newStatus === 'active' 
          ? 'Game started! You can now record buy-ins.' 
          : 'Game marked as completed.'
      );
      onStatusChange();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update event');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHost) {
    return null;
  }

  if (eventStatus === 'upcoming') {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 dark:border-amber-700 dark:bg-amber-900/20">
        <div className="text-center">
          <span className="text-3xl">🎲</span>
          <h3 className="mt-2 font-semibold text-amber-800 dark:text-amber-400">
            Ready to Start?
          </h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-500">
            Start the game to begin recording buy-ins and cash-outs.
          </p>
          <Button
            className="mt-4 bg-amber-500 text-slate-900 hover:bg-amber-400"
            onClick={() => updateStatus('active')}
            disabled={isLoading}
          >
            {isLoading ? 'Starting...' : '▶️ Start Game'}
          </Button>
        </div>
      </div>
    );
  }

  if (eventStatus === 'active') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-3 w-3 items-center justify-center">
            <span className="absolute h-3 w-3 animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative h-3 w-3 rounded-full bg-green-500"></span>
          </div>
          <span className="font-medium text-green-800 dark:text-green-400">
            Game in Progress
          </span>
        </div>
      </div>
    );
  }

  // Completed
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3">
        <span className="text-xl">✅</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Game Completed
        </span>
      </div>
    </div>
  );
}

