'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import type { Profile } from '@/types';

interface ProfileHeaderProps {
  profile: Profile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const initials = profile.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Background gradient - poker felt inspired */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-emerald-800/10 to-transparent dark:from-emerald-900/40 dark:via-emerald-800/20" />
      
      {/* Subtle pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative flex flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:items-start sm:gap-6">
        {/* Avatar */}
        <Avatar className="h-24 w-24 border-4 border-white shadow-xl dark:border-slate-800 sm:h-28 sm:w-28">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || 'User'} />
          <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-2xl font-bold text-white sm:text-3xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            {profile.display_name || 'Anonymous Player'}
          </h1>
          
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400 sm:justify-start">
            {profile.email && (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {profile.email}
              </span>
            )}
            {profile.phone && (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {profile.phone}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Member since {formatDate(profile.created_at, { month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Decorative card suits */}
        <div className="absolute right-4 top-4 hidden text-4xl opacity-10 dark:opacity-20 lg:block">
          <span className="text-red-500">♥</span>
          <span className="text-slate-900 dark:text-white">♠</span>
        </div>
      </div>
    </div>
  );
}

