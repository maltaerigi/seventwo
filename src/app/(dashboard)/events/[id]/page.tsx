import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { ROUTES, EVENT_STATUS_LABELS } from '@/constants';
import type { Event, Profile } from '@/types';

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

  // Fetch participants
  const { data: participants } = await supabase
    .from('event_participants')
    .select(`
      *,
      profile:profiles (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('event_id', id)
    .order('created_at', { ascending: true });

  // Check if current user is a participant
  const userParticipant = participants?.find(p => p.user_id === user.id);

  // Cover styling
  const isPreset = typedEvent.cover_photo_url?.startsWith('preset:');
  const presetId = isPreset ? typedEvent.cover_photo_url?.replace('preset:', '') : null;
  const presetColor = presetId ? PRESET_COLORS[presetId] : null;

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
        {isHost && (
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
      <main className="mx-auto max-w-3xl px-4 py-8">
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
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date, Time, Location */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
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
                <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">About</h2>
                <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                  {typedEvent.description}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join/RSVP */}
            {!isHost && !userParticipant && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
                <Button className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400">
                  Join Event
                </Button>
                <p className="mt-2 text-center text-xs text-slate-500">
                  {typedEvent.requires_approval ? 'Host approval required' : 'Join instantly'}
                </p>
              </div>
            )}

            {/* Participants */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
                Players ({participants?.length || 0}/{typedEvent.max_seats})
              </h2>
              
              {participants && participants.length > 0 ? (
                <ul className="space-y-3">
                  {participants.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                        {p.profile?.display_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {p.profile?.display_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.status === 'checked_in' ? 'Checked in' : p.status}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No players yet</p>
              )}
            </div>

            {/* Share */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Share</h2>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Will implement copy to clipboard
                }}
              >
                Copy Event Link
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

