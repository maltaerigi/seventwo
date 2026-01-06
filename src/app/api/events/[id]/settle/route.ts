/**
 * Event Settlement API Route
 * 
 * POST /api/events/[id]/settle
 * Finalizes the event and creates debt transactions.
 * 
 * This endpoint:
 * 1. Verifies all participants have cashed out
 * 2. Checks that books are balanced (buy-ins = cash-outs)
 * 3. Calculates optimal debt resolution
 * 4. Creates event_transactions records
 * 5. Marks event as completed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, SettleEventResponse, Debt } from '@/types/api';
import type { ParticipantWithLedger } from '@/types/database';
import { checkEventCanSettle } from '@/lib/calculations/ledger';
import { calculateDebtsFromLedger } from '@/lib/calculations/debt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<SettleEventResponse>>> {
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
            message: 'You must be logged in to settle an event',
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

    // Only host can settle
    if (event.host_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only the event host can settle the event',
          },
        },
        { status: 403 }
      );
    }

    // Check if already completed
    if (event.status === 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EVENT_CLOSED',
            message: 'Event has already been settled',
          },
        },
        { status: 400 }
      );
    }

    // Get all participants with ledger
    const { data: participants, error: participantsError } = await supabase
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
    const participantsWithLedger: ParticipantWithLedger[] = (participants || []).map(p => ({
      ...p,
      profile: p.profile || { id: p.user_id, display_name: null, avatar_url: null },
      buy_in_ledger: p.buy_in_ledger || [],
    }));

    // Check if event can be settled
    const settlementCheck = checkEventCanSettle(participantsWithLedger);
    
    if (!settlementCheck.canSettle) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: settlementCheck.reason || 'Event cannot be settled',
            details: {
              participants_still_playing: settlementCheck.summary.participantsStillPlaying,
              balance_check: settlementCheck.summary.balanceCheck,
              is_balanced: settlementCheck.summary.isBalanced,
            },
          },
        },
        { status: 400 }
      );
    }

    // Calculate debts
    const debtResult = calculateDebtsFromLedger(participantsWithLedger);

    // Create transactions in database
    const debtsToCreate = debtResult.debts.map(debt => ({
      event_id: eventId,
      from_user_id: debt.fromUserId,
      to_user_id: debt.toUserId,
      amount: debt.amount,
      status: 'pending' as const,
    }));

    if (debtsToCreate.length > 0) {
      const { error: transactionError } = await supabase
        .from('event_transactions')
        .insert(debtsToCreate);

      if (transactionError) {
        console.error('Error creating transactions:', transactionError);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to create debt transactions',
            },
          },
          { status: 500 }
        );
      }
    }

    // Mark event as completed
    const { error: updateError } = await supabase
      .from('events')
      .update({ status: 'completed' })
      .eq('id', eventId);

    if (updateError) {
      console.error('Error updating event status:', updateError);
      // Don't fail - transactions are already created
    }

    // Update participant profiles with game results
    for (const participant of participantsWithLedger) {
      // Get current profile stats
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('total_games_played, total_profit_loss')
        .eq('id', participant.user_id)
        .single();

      if (currentProfile) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            total_games_played: (currentProfile.total_games_played || 0) + 1,
            total_profit_loss: (currentProfile.total_profit_loss || 0) + participant.net_profit_loss,
          })
          .eq('id', participant.user_id);

        if (profileUpdateError) {
          // Log but don't fail - this is non-critical
          console.error('Error updating profile stats:', profileUpdateError);
        }
      }
    }

    // Format response
    const responseDebts: Debt[] = debtResult.debts.map(d => ({
      from_user_id: d.fromUserId,
      from_user_name: d.fromUserName,
      to_user_id: d.toUserId,
      to_user_name: d.toUserName,
      amount: d.amount,
    }));

    return NextResponse.json({
      success: true,
      data: {
        event_id: eventId,
        status: 'completed',
        debts_created: debtsToCreate.length,
        debts: responseDebts,
      },
    });
  } catch (error) {
    console.error('Error in settle API:', error);
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

/**
 * GET /api/events/[id]/settle
 * Preview settlement without actually settling
 * Shows what debts would be created
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{
  can_settle: boolean;
  reason?: string;
  preview_debts: Debt[];
  total_pot: number;
}>>> {
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
            message: 'You must be logged in',
          },
        },
        { status: 401 }
      );
    }

    // Get participants with ledger
    const { data: participants, error: participantsError } = await supabase
      .from('event_participants')
      .select(`
        *,
        profile:profiles!event_participants_user_id_fkey(id, display_name, avatar_url),
        buy_in_ledger(*)
      `)
      .eq('event_id', eventId)
      .in('status', ['checked_in', 'approved']);

    if (participantsError) {
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

    const participantsWithLedger: ParticipantWithLedger[] = (participants || []).map(p => ({
      ...p,
      profile: p.profile || { id: p.user_id, display_name: null, avatar_url: null },
      buy_in_ledger: p.buy_in_ledger || [],
    }));

    const settlementCheck = checkEventCanSettle(participantsWithLedger);
    const debtResult = calculateDebtsFromLedger(participantsWithLedger);

    const previewDebts: Debt[] = debtResult.debts.map(d => ({
      from_user_id: d.fromUserId,
      from_user_name: d.fromUserName,
      to_user_id: d.toUserId,
      to_user_name: d.toUserName,
      amount: d.amount,
    }));

    return NextResponse.json({
      success: true,
      data: {
        can_settle: settlementCheck.canSettle,
        reason: settlementCheck.reason,
        preview_debts: previewDebts,
        total_pot: debtResult.totalPot,
      },
    });
  } catch (error) {
    console.error('Error in settle preview API:', error);
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

