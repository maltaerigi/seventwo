/**
 * Ledger Calculation Utilities
 * 
 * This module handles all buy-in/cash-out calculations for poker events.
 * Key responsibilities:
 * - Calculate total buy-ins per participant
 * - Validate cash-outs against total money in play
 * - Generate event ledger summaries
 * - Check balance integrity (money in = money out)
 */

import type { 
  ParticipantWithLedger, 
  EventLedgerSummary,
  BuyInLedgerEntry 
} from '@/types';

/**
 * Round a number to 2 decimal places
 */
export function roundToTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Calculate total buy-in from ledger entries
 */
export function calculateTotalBuyIn(ledger: BuyInLedgerEntry[]): number {
  const total = ledger.reduce((sum, entry) => sum + entry.amount, 0);
  return roundToTwoDecimals(total);
}

/**
 * Count rebuys for a participant
 */
export function countRebuys(ledger: BuyInLedgerEntry[]): number {
  return ledger.filter(entry => entry.is_rebuy).length;
}

/**
 * Get initial buy-in amount (first entry that's not a rebuy)
 */
export function getInitialBuyIn(ledger: BuyInLedgerEntry[]): number {
  const initial = ledger.find(entry => !entry.is_rebuy);
  return initial?.amount ?? 0;
}

/**
 * Get total rebuy amount
 */
export function getTotalRebuys(ledger: BuyInLedgerEntry[]): number {
  const total = ledger
    .filter(entry => entry.is_rebuy)
    .reduce((sum, entry) => sum + entry.amount, 0);
  return roundToTwoDecimals(total);
}

/**
 * Participant financial summary
 */
export interface ParticipantSummary {
  participantId: string;
  userId: string;
  displayName: string;
  initialBuyIn: number;
  totalRebuys: number;
  rebuyCount: number;
  totalBuyIn: number;
  cashOut: number | null;
  netProfitLoss: number;
  isCashedOut: boolean;
}

/**
 * Get financial summary for a participant
 */
export function getParticipantSummary(participant: ParticipantWithLedger): ParticipantSummary {
  const ledger = participant.buy_in_ledger || [];
  const initialBuyIn = getInitialBuyIn(ledger);
  const totalRebuys = getTotalRebuys(ledger);
  const rebuyCount = countRebuys(ledger);
  const totalBuyIn = calculateTotalBuyIn(ledger);
  
  return {
    participantId: participant.id,
    userId: participant.user_id,
    displayName: participant.profile.display_name || 'Unknown',
    initialBuyIn,
    totalRebuys,
    rebuyCount,
    totalBuyIn,
    cashOut: participant.cash_out_amount,
    netProfitLoss: participant.net_profit_loss,
    isCashedOut: participant.cash_out_amount !== null,
  };
}

/**
 * Event financial summary
 */
export interface EventFinancialSummary {
  totalBuyIns: number;
  totalCashOuts: number;
  moneyStillInPlay: number;
  balanceCheck: number;
  isBalanced: boolean;
  participantsCount: number;
  participantsCashedOut: number;
  participantsStillPlaying: number;
  canSettle: boolean; // true if all participants have cashed out
}

/**
 * Calculate event-wide financial summary
 */
export function calculateEventSummary(
  participants: ParticipantWithLedger[]
): EventFinancialSummary {
  const totalBuyIns = participants.reduce(
    (sum, p) => sum + calculateTotalBuyIn(p.buy_in_ledger || []),
    0
  );
  
  const totalCashOuts = participants.reduce(
    (sum, p) => sum + (p.cash_out_amount ?? 0),
    0
  );
  
  const participantsCashedOut = participants.filter(
    p => p.cash_out_amount !== null
  ).length;
  
  const participantsStillPlaying = participants.length - participantsCashedOut;
  
  // Money still in play = total buy-ins - total cash-outs (for those who cashed out)
  const moneyStillInPlay = roundToTwoDecimals(totalBuyIns - totalCashOuts);
  
  // Balance check (should be 0 when everyone has cashed out)
  const balanceCheck = participantsStillPlaying === 0 
    ? roundToTwoDecimals(totalBuyIns - totalCashOuts)
    : 0;
  
  return {
    totalBuyIns: roundToTwoDecimals(totalBuyIns),
    totalCashOuts: roundToTwoDecimals(totalCashOuts),
    moneyStillInPlay,
    balanceCheck,
    isBalanced: Math.abs(balanceCheck) < 0.01,
    participantsCount: participants.length,
    participantsCashedOut,
    participantsStillPlaying,
    canSettle: participantsStillPlaying === 0 && participants.length > 0,
  };
}

/**
 * Validation result for cash-out
 */
export interface CashOutValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedAmount?: number;
}

/**
 * Validate a cash-out amount
 * 
 * @param amount - The cash-out amount to validate
 * @param participant - The participant cashing out
 * @param allParticipants - All participants in the event (for balance check)
 */
export function validateCashOut(
  amount: number,
  participant: ParticipantWithLedger,
  allParticipants: ParticipantWithLedger[]
): CashOutValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validation
  if (amount < 0) {
    errors.push('Cash-out amount cannot be negative');
  }
  
  if (participant.cash_out_amount !== null) {
    errors.push('Participant has already cashed out');
  }
  
  const totalBuyIn = calculateTotalBuyIn(participant.buy_in_ledger || []);
  if (totalBuyIn === 0) {
    errors.push('Participant has no buy-ins recorded');
  }
  
  // Calculate what the remaining money should be
  const otherParticipants = allParticipants.filter(p => p.id !== participant.id);
  const othersCashedOut = otherParticipants.filter(p => p.cash_out_amount !== null);
  const othersStillPlaying = otherParticipants.filter(p => p.cash_out_amount === null);
  
  // If this is the last person cashing out, we can suggest the exact amount
  if (othersStillPlaying.length === 0 && othersCashedOut.length > 0) {
    const totalBuyIns = allParticipants.reduce(
      (sum, p) => sum + calculateTotalBuyIn(p.buy_in_ledger || []),
      0
    );
    const totalCashedOut = othersCashedOut.reduce(
      (sum, p) => sum + (p.cash_out_amount ?? 0),
      0
    );
    const expectedAmount = roundToTwoDecimals(totalBuyIns - totalCashedOut);
    
    if (Math.abs(amount - expectedAmount) > 0.01) {
      warnings.push(
        `As the last player, expected cash-out is $${expectedAmount.toFixed(2)} to balance the books`
      );
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestedAmount: expectedAmount,
    };
  }
  
  // General reasonability check
  const totalEventBuyIns = allParticipants.reduce(
    (sum, p) => sum + calculateTotalBuyIn(p.buy_in_ledger || []),
    0
  );
  
  if (amount > totalEventBuyIns) {
    errors.push(
      `Cash-out ($${amount.toFixed(2)}) exceeds total money in play ($${totalEventBuyIns.toFixed(2)})`
    );
  }
  
  // Big win/loss warnings (informational)
  const profitLoss = amount - totalBuyIn;
  if (profitLoss > totalBuyIn * 3) {
    warnings.push(
      `Large win detected: +$${profitLoss.toFixed(2)} (${((profitLoss / totalBuyIn) * 100).toFixed(0)}% profit)`
    );
  }
  if (amount === 0 && totalBuyIn > 0) {
    warnings.push('Recording $0 cash-out (complete loss)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate a complete event ledger summary
 */
export function generateEventLedgerSummary(
  eventId: string,
  participants: ParticipantWithLedger[]
): EventLedgerSummary {
  const summary = calculateEventSummary(participants);
  
  return {
    event_id: eventId,
    total_buy_ins: summary.totalBuyIns,
    total_cash_outs: summary.totalCashOuts,
    balance_check: summary.balanceCheck,
    participants_count: summary.participantsCount,
    participants_cashed_out: summary.participantsCashedOut,
    participants_still_playing: summary.participantsStillPlaying,
    participants,
  };
}

/**
 * Check if an event can be settled (all players cashed out, books balanced)
 */
export interface SettlementCheck {
  canSettle: boolean;
  reason?: string;
  summary: EventFinancialSummary;
}

export function checkEventCanSettle(
  participants: ParticipantWithLedger[]
): SettlementCheck {
  const summary = calculateEventSummary(participants);
  
  if (summary.participantsCount === 0) {
    return {
      canSettle: false,
      reason: 'No participants in this event',
      summary,
    };
  }
  
  if (summary.participantsStillPlaying > 0) {
    return {
      canSettle: false,
      reason: `${summary.participantsStillPlaying} player(s) still need to cash out`,
      summary,
    };
  }
  
  if (!summary.isBalanced) {
    return {
      canSettle: false,
      reason: `Books don't balance. Discrepancy: $${Math.abs(summary.balanceCheck).toFixed(2)}`,
      summary,
    };
  }
  
  return {
    canSettle: true,
    summary,
  };
}


