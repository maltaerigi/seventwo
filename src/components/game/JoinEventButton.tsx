'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface JoinEventButtonProps {
  eventId: string;
  requiresApproval: boolean;
}

export function JoinEventButton({ eventId, requiresApproval }: JoinEventButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to join event');
      }

      toast.success(
        requiresApproval 
          ? 'Request sent! Waiting for host approval.' 
          : 'You\'ve joined the event!'
      );
      router.refresh();
    } catch (error) {
      console.error('Join error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
        onClick={handleJoin}
        disabled={isLoading}
      >
        {isLoading ? 'Joining...' : 'Join Event'}
      </Button>
      <p className="mt-2 text-center text-xs text-slate-500">
        {requiresApproval ? 'Host approval required' : 'Join instantly'}
      </p>
    </>
  );
}

