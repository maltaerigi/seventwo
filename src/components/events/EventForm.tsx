'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CoverPhotoUpload } from './CoverPhotoUpload';
import { GameSettings } from './GameSettings';
import { toast } from 'sonner';
import { 
  DEFAULT_SMALL_BLIND, 
  DEFAULT_BIG_BLIND, 
  DEFAULT_MAX_SEATS,
  ROUTES 
} from '@/constants';

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  is_private: boolean;
  requires_approval: boolean;
  small_blind: number;
  big_blind: number;
  max_seats: number;
  cover_photo_url: string | null;
}

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  eventId?: string; // If editing
  mode?: 'create' | 'edit';
}

export function EventForm({ initialData, eventId, mode = 'create' }: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    event_date: initialData?.event_date || '',
    event_time: initialData?.event_time || '19:00',
    location: initialData?.location || '',
    is_private: initialData?.is_private ?? false,
    requires_approval: initialData?.requires_approval ?? false,
    small_blind: initialData?.small_blind ?? DEFAULT_SMALL_BLIND,
    big_blind: initialData?.big_blind ?? DEFAULT_BIG_BLIND,
    max_seats: initialData?.max_seats ?? DEFAULT_MAX_SEATS,
    cover_photo_url: initialData?.cover_photo_url || null,
  });

  const updateField = <K extends keyof EventFormData>(field: K, value: EventFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Upload cover photo if there's a new file
      let coverPhotoUrl = formData.cover_photo_url;
      
      if (coverFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', coverFile);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload cover photo');
        }

        const uploadData = await uploadRes.json();
        coverPhotoUrl = uploadData.data.url;
      }

      // 2. Create/update event
      const endpoint = mode === 'create' 
        ? ROUTES.API.EVENTS 
        : `${ROUTES.API.EVENTS}/${eventId}`;
      
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cover_photo_url: coverPhotoUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Something went wrong');
      }

      toast.success(mode === 'create' ? 'Event created!' : 'Event updated!');
      
      // Redirect to event page
      router.push(ROUTES.EVENT_DETAIL(data.data.id));
      router.refresh();

    } catch (error) {
      console.error('Event form error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Cover Photo */}
      <CoverPhotoUpload
        value={formData.cover_photo_url || undefined}
        onChange={(url) => updateField('cover_photo_url', url)}
        onFileSelect={setCoverFile}
      />

      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Event Name *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Friday Night Poker"
            className="mt-1.5"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="event_date">Date *</Label>
            <Input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => updateField('event_date', e.target.value)}
              min={today}
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="event_time">Time *</Label>
            <Input
              id="event_time"
              type="time"
              value={formData.event_time}
              onChange={(e) => updateField('event_time', e.target.value)}
              className="mt-1.5"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="123 Main St, Apt 4B"
            className="mt-1.5"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Add details about your poker night..."
            rows={3}
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <Separator />

      {/* Game Settings */}
      <GameSettings
        smallBlind={formData.small_blind}
        bigBlind={formData.big_blind}
        maxSeats={formData.max_seats}
        onSmallBlindChange={(v) => updateField('small_blind', v)}
        onBigBlindChange={(v) => updateField('big_blind', v)}
        onMaxSeatsChange={(v) => updateField('max_seats', v)}
      />

      <Separator />

      {/* Privacy Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Privacy & Access
        </h3>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Private Event</p>
            <p className="text-sm text-slate-500">Only people with the link can see this event</p>
          </div>
          <input
            type="checkbox"
            checked={formData.is_private}
            onChange={(e) => updateField('is_private', e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Require Approval</p>
            <p className="text-sm text-slate-500">You&apos;ll need to approve each guest</p>
          </div>
          <input
            type="checkbox"
            checked={formData.requires_approval}
            onChange={(e) => updateField('requires_approval', e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
        </label>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="flex-1 sm:flex-none"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-1 bg-amber-500 text-slate-900 hover:bg-amber-400 sm:flex-none"
        >
          {isSubmitting 
            ? (mode === 'create' ? 'Creating...' : 'Saving...') 
            : (mode === 'create' ? 'Create Event' : 'Save Changes')
          }
        </Button>
      </div>
    </form>
  );
}

