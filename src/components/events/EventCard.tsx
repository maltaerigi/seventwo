import Link from 'next/link';
import { formatDate, formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ROUTES, EVENT_STATUS_LABELS } from '@/constants';
import type { Event } from '@/types';

// Preset cover colors (must match CoverPhotoUpload)
const PRESET_COLORS: Record<string, string> = {
  'felt-green': 'from-emerald-800 to-emerald-950',
  'felt-blue': 'from-blue-800 to-blue-950',
  'felt-red': 'from-red-800 to-red-950',
  'dark': 'from-slate-800 to-slate-950',
  'gold': 'from-amber-700 to-amber-900',
};

interface EventCardProps {
  event: Event;
  showStatus?: boolean;
}

export function EventCard({ event, showStatus = true }: EventCardProps) {
  // Determine cover style
  const isPreset = event.cover_photo_url?.startsWith('preset:');
  const presetId = isPreset ? event.cover_photo_url?.replace('preset:', '') : null;
  const presetColor = presetId ? PRESET_COLORS[presetId] : null;

  return (
    <Link 
      href={ROUTES.EVENT_DETAIL(event.id)}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
    >
      {/* Cover */}
      <div className="relative aspect-[2/1] w-full overflow-hidden">
        {event.cover_photo_url && !isPreset ? (
          // Custom image
          <img
            src={event.cover_photo_url}
            alt={event.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : presetColor ? (
          // Preset gradient
          <div className={`h-full w-full bg-gradient-to-br ${presetColor} transition-transform group-hover:scale-105`}>
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl opacity-50">🃏</span>
            </div>
          </div>
        ) : (
          // Default fallback
          <div className="h-full w-full bg-gradient-to-br from-emerald-800 to-emerald-950">
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl opacity-50">🃏</span>
            </div>
          </div>
        )}

        {/* Status badge */}
        {showStatus && (
          <div className="absolute right-2 top-2">
            <Badge 
              variant={event.status === 'active' ? 'default' : 'secondary'}
              className={
                event.status === 'active' 
                  ? 'bg-green-500 text-white' 
                  : event.status === 'completed'
                  ? 'bg-slate-500 text-white'
                  : ''
              }
            >
              {EVENT_STATUS_LABELS[event.status] || event.status}
            </Badge>
          </div>
        )}

        {/* Private indicator */}
        {event.is_private && (
          <div className="absolute left-2 top-2">
            <Badge variant="outline" className="border-white/30 bg-black/30 text-white">
              Private
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
          {event.title}
        </h3>
        
        <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <p className="flex items-center gap-2">
            <span>📅</span>
            {formatDate(event.event_date)} at {formatTime(event.event_time)}
          </p>
          <p className="flex items-center gap-2">
            <span>📍</span>
            <span className="truncate">{event.location}</span>
          </p>
          <p className="flex items-center gap-2">
            <span>💰</span>
            ${event.small_blind}/${event.big_blind} blinds • {event.max_seats} seats
          </p>
        </div>
      </div>
    </Link>
  );
}

