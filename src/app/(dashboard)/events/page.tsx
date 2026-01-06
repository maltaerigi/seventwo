import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/events';
import { ROUTES } from '@/constants';
import type { Event } from '@/types';

export const metadata = {
  title: 'My Events',
};

export default async function EventsPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // Fetch user's events (as host)
  const { data: hostedEvents } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', user.id)
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true });

  // Fetch events user is participating in (but not hosting)
  const { data: participatingEvents } = await supabase
    .from('event_participants')
    .select(`
      event:events (*)
    `)
    .eq('user_id', user.id)
    .neq('events.host_id', user.id);

  const hosted = (hostedEvents || []) as Event[];
  const participating = (participatingEvents || [])
    .map(p => p.event as unknown as Event | null)
    .filter((e): e is Event => e !== null);

  const hasEvents = hosted.length > 0 || participating.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🃏</span>
            <span className="font-semibold text-slate-900 dark:text-white">Seventwo</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href={ROUTES.PROFILE}
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Events</h1>
          <Button asChild className="bg-amber-500 text-slate-900 hover:bg-amber-400">
            <Link href={ROUTES.EVENT_CREATE}>
              <span className="mr-2">+</span>
              Create Event
            </Link>
          </Button>
        </div>

        {!hasEvents ? (
          // Empty state
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
              <span className="text-3xl">🃏</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No events yet</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Create your first poker night and invite your friends!
            </p>
            <Button asChild className="mt-6 bg-amber-500 text-slate-900 hover:bg-amber-400">
              <Link href={ROUTES.EVENT_CREATE}>Create Event</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hosted Events */}
            {hosted.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Events I&apos;m Hosting
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {hosted.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* Participating Events */}
            {participating.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Events I&apos;m Attending
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {participating.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

