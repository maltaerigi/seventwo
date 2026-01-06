import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createEventSchema } from '@/lib/validations';
import { generateUniqueSlug } from '@/lib/utils';
import { ERROR_CODES, DEFAULT_PAGE_SIZE } from '@/constants';

/**
 * GET /api/events
 * List events (user's events or public events)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get current user (optional - for filtering)
    const { data: { user } } = await supabase.auth.getUser();

    // Parse query params
    const status = searchParams.get('status');
    const hostOnly = searchParams.get('host_only') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE)),
      100
    );
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true });

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // If user is logged in and wants their hosted events
    if (user && hostOnly) {
      query = query.eq('host_id', user.id);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: events, error, count } = await query;

    if (error) {
      console.error('Events fetch error:', error);
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to fetch events' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Create a new event
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Please log in to create an event' } },
        { status: 401 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const result = createEventSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: ERROR_CODES.VALIDATION_ERROR, 
            message: result.error.issues[0]?.message || 'Invalid input',
            details: result.error.issues,
          } 
        },
        { status: 400 }
      );
    }

    const eventData = result.data;

    // Generate unique slug from title
    const slug = generateUniqueSlug(eventData.title);

    // Insert event
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        host_id: user.id,
        slug,
      })
      .select()
      .single();

    if (error) {
      console.error('Event creation error:', error);
      
      // Handle unique constraint violation (slug collision - very rare)
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: { code: ERROR_CODES.ALREADY_EXISTS, message: 'Please try again' } },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to create event' } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: event },
      { status: 201 }
    );
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

