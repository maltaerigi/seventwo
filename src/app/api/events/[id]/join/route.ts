/**
 * Join Event API Route
 * 
 * POST /api/events/[id]/join
 * Allows a user to join/RSVP to an event.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types/api';
import type { EventParticipant } from '@/types/database';

interface JoinResponse {
  participant: EventParticipant;
  status: 'joined' | 'pending_approval';
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<JoinResponse>>> {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to join events',
          },
        },
        { status: 401 }
      );
    }

    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, host_id, status, requires_approval, max_seats, is_private')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Event not found',
          },
        },
        { status: 404 }
      );
    }

    // Can't join completed events
    if (event.status === 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EVENT_CLOSED',
            message: 'This event has already ended',
          },
        },
        { status: 400 }
      );
    }

    // Check if already a participant
    const { data: existingParticipant } = await supabase
      .from('event_participants')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (existingParticipant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_JOINED',
            message: existingParticipant.status === 'pending' 
              ? 'Your request is pending approval' 
              : 'You have already joined this event',
          },
        },
        { status: 400 }
      );
    }

    // Check max seats
    const { count: participantCount } = await supabase
      .from('event_participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('status', ['approved', 'checked_in']);

    if ((participantCount ?? 0) >= event.max_seats) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EVENT_FULL',
            message: 'This event is full',
          },
        },
        { status: 400 }
      );
    }

    // Determine initial status
    // Host is auto-approved, others depend on requires_approval setting
    const initialStatus = event.host_id === user.id || !event.requires_approval 
      ? 'approved' 
      : 'pending';

    // Create participant record
    const { data: participant, error: insertError } = await supabase
      .from('event_participants')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: initialStatus,
      })
      .select()
      .single();

    if (insertError || !participant) {
      console.error('Error creating participant:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to join event',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        participant,
        status: initialStatus === 'approved' ? 'joined' : 'pending_approval',
      },
    });
  } catch (error) {
    console.error('Error in join API:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

