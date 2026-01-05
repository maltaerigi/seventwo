/**
 * Cash-Out API Route
 * 
 * POST /api/events/[id]/cash-out
 * Records a cash-out for a participant.
 * Only the event host can record cash-outs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types/api';
import type { EventParticipant, ParticipantWithLedger } from '@/types/database';
import { recordCashOutSchema } from '@/lib/validations/participant';
import { validateCashOut } from '@/lib/calculations/ledger';

interface CashOutResponse {
  participant: EventParticipant;
  net_profit_loss: number;
  validation_warnings: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CashOutResponse>>> {
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
            message: 'You must be logged in to record cash-outs',
          },
        },
        { status: 401 }
      );
    }

    // Get event to verify host
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, host_id, status')
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

    // Only host can record cash-outs
    if (event.host_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the event host can record cash-outs',
          },
        },
        { status: 403 }
      );
    }

    // Event must be active
    if (event.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EVENT_CLOSED',
            message: 'Cash-outs can only be recorded for active events',
          },
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = recordCashOutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0]?.message || 'Invalid input',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { participant_id, amount } = validation.data;

    // Get all participants with ledger for validation
    const { data: allParticipants, error: participantsError } = await supabase
      .from('event_participants')
      .select(`
        *,
        profile:profiles!event_participants_user_id_fkey(id, display_name, avatar_url),
        buy_in_ledger(*)
      `)
      .eq('event_id', eventId)
      .in('status', ['checked_in', 'approved']);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch participants',
          },
        },
        { status: 500 }
      );
    }

    // Transform to ParticipantWithLedger
    const participantsWithLedger: ParticipantWithLedger[] = (allParticipants || []).map(p => ({
      ...p,
      profile: p.profile || { id: p.user_id, display_name: null, avatar_url: null },
      buy_in_ledger: p.buy_in_ledger || [],
    }));

    // Find the target participant
    const participant = participantsWithLedger.find(p => p.id === participant_id);
    if (!participant) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Participant not found in this event',
          },
        },
        { status: 404 }
      );
    }

    // Validate cash-out
    const cashOutValidation = validateCashOut(amount, participant, participantsWithLedger);
    
    if (!cashOutValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: cashOutValidation.errors.join('. '),
            details: { 
              errors: cashOutValidation.errors,
              suggested_amount: cashOutValidation.suggestedAmount,
            },
          },
        },
        { status: 400 }
      );
    }

    // Update participant with cash-out
    const { data: updatedParticipant, error: updateError } = await supabase
      .from('event_participants')
      .update({
        cash_out_amount: amount,
        cashed_out_at: new Date().toISOString(),
      })
      .eq('id', participant_id)
      .select()
      .single();

    if (updateError || !updatedParticipant) {
      console.error('Error updating participant:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to record cash-out',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        participant: updatedParticipant,
        net_profit_loss: updatedParticipant.net_profit_loss,
        validation_warnings: cashOutValidation.warnings,
      },
    });
  } catch (error) {
    console.error('Error in cash-out API:', error);
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

