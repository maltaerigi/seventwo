/**
 * Event Ledger API Route
 * 
 * GET /api/events/[id]/ledger
 * Returns complete ledger summary for an event including:
 * - All participants with their buy-ins and cash-outs
 * - Event totals (money in, money out, balance)
 * - Settlement status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { 
  ApiResponse, 
  EventLedgerResponse,
  LedgerParticipantSummary 
} from '@/types/api';
import type { ParticipantWithLedger } from '@/types/database';
import { 
  calculateEventSummary, 
  getParticipantSummary 
} from '@/lib/calculations/ledger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<EventLedgerResponse>>> {
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
            message: 'You must be logged in to view event ledger',
          },
        },
        { status: 401 }
      );
    }

    // Get event to verify access
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, host_id, is_private, status')
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

    // Get participants with profiles and ledger entries
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

    // Transform to ParticipantWithLedger format
    const participantsWithLedger: ParticipantWithLedger[] = (participants || []).map(p => ({
      ...p,
      profile: p.profile || { id: p.user_id, display_name: null, avatar_url: null },
      buy_in_ledger: p.buy_in_ledger || [],
    }));

    // Calculate event summary
    const summary = calculateEventSummary(participantsWithLedger);

    // Build participant summaries
    const participantSummaries: LedgerParticipantSummary[] = participantsWithLedger.map(p => {
      const ps = getParticipantSummary(p);
      return {
        participant_id: ps.participantId,
        user_id: ps.userId,
        display_name: ps.displayName,
        initial_buy_in: ps.initialBuyIn,
        total_rebuys: ps.totalRebuys,
        rebuy_count: ps.rebuyCount,
        total_buy_in: ps.totalBuyIn,
        cash_out: ps.cashOut,
        net_profit_loss: ps.netProfitLoss,
        is_cashed_out: ps.isCashedOut,
      };
    });

    const response: EventLedgerResponse = {
      event_id: eventId,
      total_buy_ins: summary.totalBuyIns,
      total_cash_outs: summary.totalCashOuts,
      money_still_in_play: summary.moneyStillInPlay,
      balance_check: summary.balanceCheck,
      is_balanced: summary.isBalanced,
      participants_count: summary.participantsCount,
      participants_cashed_out: summary.participantsCashedOut,
      participants_still_playing: summary.participantsStillPlaying,
      can_settle: summary.canSettle,
      participants: participantSummaries,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error in ledger API:', error);
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

