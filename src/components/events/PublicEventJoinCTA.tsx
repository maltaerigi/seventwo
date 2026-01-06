'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JoinEventButton } from '@/components/game/JoinEventButton';
import { ROUTES, EVENT_STATUS_LABELS } from '@/constants';

interface PublicEventJoinCTAProps {
  eventId: string;
  eventSlug: string;
  isLoggedIn: boolean;
  isParticipant: boolean;
  participantStatus?: 'pending' | 'approved' | 'denied' | 'checked_in';
  isFull: boolean;
  eventStatus: string;
  requiresApproval: boolean;
}

export function PublicEventJoinCTA({
  eventId,
  eventSlug,
  isLoggedIn,
  isParticipant,
  participantStatus,
  isFull,
  eventStatus,
  requiresApproval,
}: PublicEventJoinCTAProps) {
  // Event is completed
  if (eventStatus === 'completed') {
    return (
      <div className="rounded-xl border border-slate-300 bg-slate-100 p-6 text-center dark:border-slate-600 dark:bg-slate-800">
        <p className="text-slate-700 dark:text-slate-300">
          This event has ended
        </p>
        <Badge variant="secondary" className="mt-2">
          {EVENT_STATUS_LABELS.completed}
        </Badge>
      </div>
    );
  }

  // Event is full
  if (isFull) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/20">
        <p className="font-medium text-red-700 dark:text-red-400">
          Event is Full
        </p>
        <p className="mt-1 text-sm text-red-600 dark:text-red-500">
          All spots have been taken
        </p>
      </div>
    );
  }

  // User is not logged in
  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
        <p className="text-slate-700 dark:text-slate-300">
          Sign in to join this poker night
        </p>
        <Button 
          asChild 
          className="mt-4 bg-amber-500 text-slate-900 hover:bg-amber-400"
        >
          <Link href={`${ROUTES.LOGIN}?redirectTo=${ROUTES.EVENT_PUBLIC(eventSlug)}`}>
            Sign In to Join
          </Link>
        </Button>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Free to join • {requiresApproval ? 'Host approval required' : 'Join instantly'}
        </p>
      </div>
    );
  }

  // User is already a participant
  if (isParticipant) {
    if (participantStatus === 'pending') {
      return (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            Request Pending
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Waiting for host approval
          </p>
          <Badge variant="secondary" className="mt-3">
            Pending Approval
          </Badge>
          <Button 
            asChild 
            variant="outline" 
            className="mt-4"
          >
            <Link href={ROUTES.EVENT_DETAIL(eventId)}>
              View Event Details
            </Link>
          </Button>
        </div>
      );
    }

    if (participantStatus === 'denied') {
      return (
        <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/20">
          <p className="font-medium text-red-700 dark:text-red-400">
            Request Denied
          </p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-500">
            Your request to join was not approved
          </p>
        </div>
      );
    }

    // User is approved or checked in
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center">
        <p className="font-medium text-green-700 dark:text-green-400">
          You're In!
        </p>
        <p className="mt-1 text-sm text-green-600 dark:text-green-500">
          {participantStatus === 'checked_in' 
            ? 'You\'ve checked in to this event' 
            : 'You\'re registered for this event'}
        </p>
        <Button 
          asChild 
          className="mt-4 bg-green-600 text-white hover:bg-green-700"
        >
          <Link href={ROUTES.EVENT_DETAIL(eventId)}>
            View Event Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  // User is logged in and can join
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
      <p className="text-slate-700 dark:text-slate-300">
        Ready to play?
      </p>
      <div className="mt-4">
        <JoinEventButton 
          eventId={eventId}
          requiresApproval={requiresApproval}
        />
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {requiresApproval ? 'Host approval required' : 'Join instantly'}
      </p>
    </div>
  );
}

