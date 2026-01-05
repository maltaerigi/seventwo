import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { EventForm } from '@/components/events';
import { ROUTES } from '@/constants';

export const metadata = {
  title: 'Create Event',
};

export default async function CreateEventPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`${ROUTES.LOGIN}?redirectTo=${ROUTES.EVENT_CREATE}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link href={ROUTES.EVENTS} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </Link>
          <span className="text-sm text-slate-500">Draft</span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Event</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Set up your poker night in a few clicks
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <EventForm mode="create" />
        </div>
      </main>
    </div>
  );
}

