import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { ParticipantManager, JoinEventButton, CopyLinkButton } from '@/components/game';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { ROUTES, EVENT_STATUS_LABELS } from '@/constants';
import type { Event, Profile, ParticipantWithLedger, EventStatus } from '@/types';

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

// Preset cover colors
const PRESET_COLORS: Record<string, string> = {
  'felt-green': 'from-emerald-800 to-emerald-950',
  'felt-blue': 'from-blue-800 to-blue-950',
  'felt-red': 'from-red-800 to-red-950',
  'dark': 'from-slate-800 to-slate-950',
  'gold': 'from-amber-700 to-amber-900',
};

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`${ROUTES.LOGIN}?redirectTo=${ROUTES.EVENT_DETAIL(id)}`);
  }

  // Fetch event with host info
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      host:profiles!events_host_id_fkey (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error || !event) {
    notFound();
  }

  const typedEvent = event as Event & { host: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> };
  const isHost = typedEvent.host_id === user.id;

  // Fetch participants with ledger data
  const { data: participantsData } = await supabase
    .from('event_participants')
    .select(`
      *,
      profile:profiles!event_participants_user_id_fkey (
        id,
        display_name,
        avatar_url
      ),
      buy_in_ledger (*)
    `)
    .eq('event_id', id)
    .order('created_at', { ascending: true });

  // Transform to ParticipantWithLedger
  const participants: ParticipantWithLedger[] = (participantsData || []).map(p => ({
    ...p,
    profile: p.profile || { id: p.user_id, display_name: null, avatar_url: null },
    buy_in_ledger: p.buy_in_ledger || [],
  }));

  // Check if current user is a participant
  const userParticipant = participants.find(p => p.user_id === user.id);

  // Cover styling
  const isPreset = typedEvent.cover_photo_url?.startsWith('preset:');
  const presetId = isPreset ? typedEvent.cover_photo_url?.replace('preset:', '') : null;
  const presetColor = presetId ? PRESET_COLORS[presetId] : null;

  // Share URL
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/e/${typedEvent.slug}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Cover */}
      <div className="relative h-48 w-full sm:h-64">
        {typedEvent.cover_photo_url && !isPreset ? (
          <img
            src={typedEvent.cover_photo_url}
            alt={typedEvent.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${presetColor || 'from-emerald-800 to-emerald-950'}`}>
            <div className="flex h-full items-center justify-center">
              <span className="text-6xl opacity-30">🃏</span>
            </div>
          </div>
        )}

        {/* Back button */}
        <Link
          href={ROUTES.EVENTS}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Edit button (host only) */}
        {isHost && typedEvent.status !== 'completed' && (
          <Link
            href={`${ROUTES.EVENT_DETAIL(id)}/edit`}
            className="absolute right-4 top-4 flex h-10 items-center gap-2 rounded-full bg-black/30 px-4 text-sm text-white backdrop-blur transition-colors hover:bg-black/50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </Link>
        )}
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {typedEvent.title}
              </h1>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Hosted by {typedEvent.host.display_name || 'Anonymous'}
              </p>
            </div>
            <Badge 
              variant={typedEvent.status === 'active' ? 'default' : 'secondary'}
              className={
                typedEvent.status === 'active' 
                  ? 'bg-green-500 text-white' 
                  : typedEvent.status === 'completed'
                  ? 'bg-slate-500 text-white'
                  : ''
              }
            >
              {EVENT_STATUS_LABELS[typedEvent.status] || typedEvent.status}
            </Badge>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - Game Management */}
          <div className="lg:col-span-2">
            <ParticipantManager
              eventId={id}
              eventStatus={typedEvent.status as EventStatus}
              isHost={isHost}
              participants={participants}
              defaultBuyIn={typedEvent.big_blind * 100} // Default buy-in = 100 big blinds
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
                📋 Event Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formatDate(typedEvent.event_date)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {formatTime(typedEvent.event_time)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">📍</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {typedEvent.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">💰</span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formatCurrency(typedEvent.small_blind)} / {formatCurrency(typedEvent.big_blind)} blinds
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {typedEvent.max_seats} seats max
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {typedEvent.description && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">About</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
                  {typedEvent.description}
                </p>
              </div>
            )}

            {/* Join/RSVP */}
            {!isHost && !userParticipant && typedEvent.status !== 'completed' && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <JoinEventButton 
                  eventId={id} 
                  requiresApproval={typedEvent.requires_approval}
                />
              </div>
            )}

            {/* Share */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">🔗 Share</h3>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                <p className="truncate text-xs text-slate-500">
                  {shareUrl}
                </p>
              </div>
              <CopyLinkButton url={shareUrl} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
