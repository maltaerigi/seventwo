/**
 * Buy-In API Route
 * 
 * POST /api/events/[id]/buy-in
 * Records a buy-in or rebuy for a participant.
 * Only the event host can record buy-ins.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types/api';
import type { BuyInLedgerEntry } from '@/types/database';
import { recordBuyInSchema, recordRebuySchema } from '@/lib/validations/participant';

interface BuyInRequest {
  participant_id: string;
  amount: number;
  is_rebuy?: boolean;
  notes?: string;
}

interface BuyInResponse {
  ledger_entry: BuyInLedgerEntry;
  participant_total_buy_in: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<BuyInResponse>>> {
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
            message: 'You must be logged in to record buy-ins',
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

    // Only host can record buy-ins
    if (event.host_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the event host can record buy-ins',
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
            message: 'Buy-ins can only be recorded for active events',
          },
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body: BuyInRequest = await request.json();
    const isRebuy = body.is_rebuy ?? false;
    
    const schema = isRebuy ? recordRebuySchema : recordBuyInSchema;
    const validation = schema.safeParse({
      participant_id: body.participant_id,
      amount: body.amount,
      notes: body.notes,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.issues[0]?.message || 'Invalid input',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // Verify participant belongs to this event
    const { data: participant, error: participantError } = await supabase
      .from('event_participants')
      .select('id, event_id, user_id, cash_out_amount, status')
      .eq('id', body.participant_id)
      .eq('event_id', eventId)
      .single();

    if (participantError || !participant) {
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

    // Check if participant has already cashed out
    if (participant.cash_out_amount !== null) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cannot add buy-in for a participant who has already cashed out',
          },
        },
        { status: 400 }
      );
    }

    // Check if this is first buy-in
    const { count: existingBuyIns } = await supabase
      .from('buy_in_ledger')
      .select('*', { count: 'exact', head: true })
      .eq('participant_id', body.participant_id);

    const isActuallyRebuy = (existingBuyIns ?? 0) > 0;

    // Insert ledger entry
    const { data: ledgerEntry, error: insertError } = await supabase
      .from('buy_in_ledger')
      .insert({
        participant_id: body.participant_id,
        amount: body.amount,
        is_rebuy: isActuallyRebuy,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (insertError || !ledgerEntry) {
      console.error('Error inserting ledger entry:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to record buy-in',
          },
        },
        { status: 500 }
      );
    }

    // Get updated total (trigger should have updated this, but let's verify)
    const { data: updatedParticipant } = await supabase
      .from('event_participants')
      .select('buy_in_amount')
      .eq('id', body.participant_id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        ledger_entry: ledgerEntry,
        participant_total_buy_in: updatedParticipant?.buy_in_amount ?? body.amount,
      },
    });
  } catch (error) {
    console.error('Error in buy-in API:', error);
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

