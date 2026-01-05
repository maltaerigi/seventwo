import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { ROUTES, EVENT_STATUS_LABELS, APP_NAME } from '@/constants';
import type { Event, Profile } from '@/types';

interface PublicEventPageProps {
  params: Promise<{ slug: string }>;
}

// Preset cover colors
const PRESET_COLORS: Record<string, string> = {
  'felt-green': 'from-emerald-800 to-emerald-950',
  'felt-blue': 'from-blue-800 to-blue-950',
  'felt-red': 'from-red-800 to-red-950',
  'dark': 'from-slate-800 to-slate-950',
  'gold': 'from-amber-700 to-amber-900',
};

export async function generateMetadata({ params }: PublicEventPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from('events')
    .select('title, description')
    .eq('slug', slug)
    .single();

  if (!event) {
    return { title: 'Event Not Found' };
  }

  return {
    title: event.title,
    description: event.description || `Join this poker night on ${APP_NAME}`,
  };
}

export default async function PublicEventPage({ params }: PublicEventPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get current user (optional)
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch event by slug
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
    .eq('slug', slug)
    .single();

  if (error || !event) {
    notFound();
  }

  const typedEvent = event as Event & { host: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> };
  
  // For private events, check if user has access
  // (In a full implementation, we'd check if user is a participant or has the share token)

  // Cover styling
  const isPreset = typedEvent.cover_photo_url?.startsWith('preset:');
  const presetId = isPreset ? typedEvent.cover_photo_url?.replace('preset:', '') : null;
  const presetColor = presetId ? PRESET_COLORS[presetId] : null;

  // Count participants
  const { count: participantCount } = await supabase
    .from('event_participants')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', typedEvent.id)
    .in('status', ['approved', 'checked_in']);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Cover */}
      <div className="relative h-56 w-full sm:h-72">
        {typedEvent.cover_photo_url && !isPreset ? (
          <img
            src={typedEvent.cover_photo_url}
            alt={typedEvent.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${presetColor || 'from-emerald-800 to-emerald-950'}`}>
            <div className="flex h-full items-center justify-center">
              <span className="text-8xl opacity-20">🃏</span>
            </div>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

        {/* Logo */}
        <Link href="/" className="absolute left-4 top-4 flex items-center gap-2 text-white/80 hover:text-white">
          <span className="text-xl">🃏</span>
          <span className="font-semibold">{APP_NAME}</span>
        </Link>

        {/* Status */}
        <div className="absolute right-4 top-4">
          <Badge 
            variant={typedEvent.status === 'active' ? 'default' : 'secondary'}
            className={
              typedEvent.status === 'active' 
                ? 'bg-green-500 text-white' 
                : typedEvent.status === 'completed'
                ? 'bg-slate-500 text-white'
                : 'bg-white/20 text-white'
            }
          >
            {EVENT_STATUS_LABELS[typedEvent.status] || typedEvent.status}
          </Badge>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {typedEvent.title}
          </h1>
          <p className="mt-1 text-white/80">
            Hosted by {typedEvent.host.display_name || 'Anonymous'}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Quick info cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500">Date & Time</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {formatDate(typedEvent.event_date, { month: 'short', day: 'numeric' })}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {formatTime(typedEvent.event_time)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500">Blinds</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {formatCurrency(typedEvent.small_blind)} / {formatCurrency(typedEvent.big_blind)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500">Players</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              {participantCount || 0} / {typedEvent.max_seats}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {(typedEvent.max_seats - (participantCount || 0))} spots left
            </p>
          </div>
        </div>

        {/* Location - shown only if logged in or event is public */}
        {!typedEvent.is_private && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start gap-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {user ? typedEvent.location : 'Location visible after joining'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {typedEvent.description && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">About this event</h2>
            <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-400">
              {typedEvent.description}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
          {user ? (
            <>
              <p className="text-slate-700 dark:text-slate-300">Ready to play?</p>
              <Button className="mt-4 bg-amber-500 text-slate-900 hover:bg-amber-400">
                Join This Event
              </Button>
            </>
          ) : (
            <>
              <p className="text-slate-700 dark:text-slate-300">
                Sign in to join this poker night
              </p>
              <Button asChild className="mt-4 bg-amber-500 text-slate-900 hover:bg-amber-400">
                <Link href={`${ROUTES.LOGIN}?redirectTo=${ROUTES.EVENT_PUBLIC(slug)}`}>
                  Sign In to Join
                </Link>
              </Button>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm text-slate-500">
          Powered by <Link href="/" className="text-amber-600 hover:underline">{APP_NAME}</Link>
        </p>
      </footer>
    </div>
  );
}

