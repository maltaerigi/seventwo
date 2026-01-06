import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { ROUTES, EVENT_STATUS_LABELS, APP_NAME, APP_URL } from '@/constants';
import type { Event, Profile } from '@/types';
import { JoinEventButton } from '@/components/game/JoinEventButton';
import { PublicEventJoinCTA } from '@/components/events/PublicEventJoinCTA';

interface PublicEventPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

// Preset cover colors
const PRESET_COLORS: Record<string, string> = {
  'felt-green': 'from-emerald-800 to-emerald-950',
  'felt-blue': 'from-blue-800 to-blue-950',
  'felt-red': 'from-red-800 to-red-950',
  'dark': 'from-slate-800 to-slate-950',
  'gold': 'from-amber-700 to-amber-900',
};

export async function generateMetadata({ params, searchParams }: PublicEventPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from('events')
    .select('title, description, cover_photo_url, event_date, location, host:profiles!events_host_id_fkey(display_name)')
    .eq('slug', slug)
    .single();

  if (!event) {
    return { 
      title: 'Event Not Found',
      description: 'The event you are looking for could not be found.',
    };
  }

  const typedEvent = event as Event & { host: Pick<Profile, 'display_name'> };
  const eventUrl = `${APP_URL}${ROUTES.EVENT_PUBLIC(slug)}`;
  const description = typedEvent.description || `Join ${typedEvent.host.display_name || 'this host'} for a poker night on ${formatDate(typedEvent.event_date)}. ${APP_NAME} - The ultimate poker night companion.`;
  
  // Get cover image URL
  const coverImage = typedEvent.cover_photo_url && !typedEvent.cover_photo_url.startsWith('preset:')
    ? typedEvent.cover_photo_url
    : `${APP_URL}/og-image.png`; // Fallback to default OG image

  return {
    title: `${typedEvent.title} | ${APP_NAME}`,
    description,
    openGraph: {
      title: typedEvent.title,
      description,
      url: eventUrl,
      siteName: APP_NAME,
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: typedEvent.title,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: typedEvent.title,
      description,
      images: [coverImage],
    },
    alternates: {
      canonical: eventUrl,
    },
  };
}

export default async function PublicEventPage({ params, searchParams }: PublicEventPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;
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
  
  // Check access for private events
  let hasAccess = true;
  if (typedEvent.is_private) {
    // Check if user is the host
    if (user?.id === typedEvent.host_id) {
      hasAccess = true;
    }
    // Check if user is a participant
    else if (user) {
      const { data: participant } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', typedEvent.id)
        .eq('user_id', user.id)
        .single();
      hasAccess = !!participant;
    }
    // Check share token
    else if (token && typedEvent.share_token === token) {
      hasAccess = true;
    } else {
      hasAccess = false;
    }
  }

  // If private event and no access, show limited info
  if (typedEvent.is_private && !hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-800">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Private Event
            </h1>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              This is a private event. You need to be invited to view the details.
            </p>
            {!user && (
              <div className="mt-6">
                <Button asChild className="bg-amber-500 text-slate-900 hover:bg-amber-400">
                  <Link href={`${ROUTES.LOGIN}?redirectTo=${ROUTES.EVENT_PUBLIC(slug)}${token ? `&token=${token}` : ''}`}>
                    Sign In to Access
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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

  // Get limited participant preview (first 5 for public view)
  const { data: participantPreview } = await supabase
    .from('event_participants')
    .select(`
      profile:profiles!event_participants_user_id_fkey (
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('event_id', typedEvent.id)
    .in('status', ['approved', 'checked_in'])
    .limit(5);

  // Check if current user is already a participant
  let userParticipant = null;
  if (user) {
    const { data: participant } = await supabase
      .from('event_participants')
      .select('id, status')
      .eq('event_id', typedEvent.id)
      .eq('user_id', user.id)
      .single();
    userParticipant = participant;
  }

  const isFull = (participantCount || 0) >= typedEvent.max_seats;
  const canJoin = user && !userParticipant && !isFull && typedEvent.status !== 'completed';

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
            <p className={`text-sm ${isFull ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
              {isFull ? 'Event full' : `${typedEvent.max_seats - (participantCount || 0)} spots left`}
            </p>
          </div>
        </div>

        {/* Location - gated content */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start gap-3">
            <span className="text-xl">📍</span>
            <div className="flex-1">
              {user || hasAccess ? (
                <p className="font-medium text-slate-900 dark:text-white">
                  {typedEvent.location}
                </p>
              ) : (
                <>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Location
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Sign in to see the location
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Participant Preview - gated */}
        {participantPreview && participantPreview.length > 0 && (user || hasAccess) && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
              Players ({participantCount || 0})
            </h3>
            <div className="flex flex-wrap gap-2">
              {participantPreview.map((p) => {
                const profile = p.profile as Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null;
                if (!profile) return null;
                return (
                  <div
                    key={profile.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  >
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name || 'Player'}
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-slate-900">
                        {(profile.display_name || '?')[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {profile.display_name || 'Anonymous'}
                    </span>
                  </div>
                );
              })}
              {(participantCount || 0) > 5 && (
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    +{(participantCount || 0) - 5} more
                  </span>
                </div>
              )}
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

        {/* CTA - Enhanced with proper join functionality */}
        <div className="mt-8">
          <PublicEventJoinCTA
            eventId={typedEvent.id}
            eventSlug={slug}
            isLoggedIn={!!user}
            isParticipant={!!userParticipant}
            participantStatus={userParticipant?.status}
            isFull={isFull}
            eventStatus={typedEvent.status}
            requiresApproval={typedEvent.requires_approval}
          />
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
