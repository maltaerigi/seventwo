import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateEventSchema } from '@/lib/validations';
import { ERROR_CODES } from '@/constants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/events/[id]
 * Get a single event by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

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
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'Event not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error('Event fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[id]
 * Update an event (host only)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Please log in' } },
        { status: 401 }
      );
    }

    // Verify ownership
    const { data: existingEvent } = await supabase
      .from('events')
      .select('host_id')
      .eq('id', id)
      .single();

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'Event not found' } },
        { status: 404 }
      );
    }

    if (existingEvent.host_id !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.FORBIDDEN, message: 'You can only edit your own events' } },
        { status: 403 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const result = updateEventSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: ERROR_CODES.VALIDATION_ERROR, 
            message: result.error.errors[0]?.message || 'Invalid input' 
          } 
        },
        { status: 400 }
      );
    }

    // Update event
    const { data: event, error } = await supabase
      .from('events')
      .update(result.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Event update error:', error);
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to update event' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    console.error('Event update error:', error);
    return NextResponse.json(
      { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]
 * Delete an event (host only)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Please log in' } },
        { status: 401 }
      );
    }

    // Verify ownership and delete
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('host_id', user.id); // Only delete if user is host

    if (error) {
      console.error('Event deletion error:', error);
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to delete event' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Event deletion error:', error);
    return NextResponse.json(
      { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

