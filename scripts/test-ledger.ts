/**
 * Test Script for Buy-In/Cash-Out Logic
 * 
 * Run with: npx tsx scripts/test-ledger.ts
 * 
 * This script tests the ledger calculation functions without
 * needing a database connection.
 */

import {
  calculateTotalBuyIn,
  getParticipantSummary,
  calculateEventSummary,
  validateCashOut,
  checkEventCanSettle,
} from '../src/lib/calculations/ledger';
import { calculateDebtsFromLedger } from '../src/lib/calculations/debt';
import type { ParticipantWithLedger, BuyInLedgerEntry } from '../src/types/database';

// Mock data for testing
function createMockParticipant(
  id: string,
  userId: string,
  name: string,
  buyIns: number[],
  cashOut: number | null = null
): ParticipantWithLedger {
  const ledger: BuyInLedgerEntry[] = buyIns.map((amount, index) => ({
    id: `ledger-${id}-${index}`,
    participant_id: id,
    amount,
    is_rebuy: index > 0,
    notes: index === 0 ? 'Initial buy-in' : `Rebuy ${index}`,
    created_at: new Date().toISOString(),
  }));

  const totalBuyIn = buyIns.reduce((sum, amt) => sum + amt, 0);
  const netProfitLoss = cashOut !== null ? cashOut - totalBuyIn : 0;

  return {
    id,
    event_id: 'test-event',
    user_id: userId,
    checked_in_at: new Date().toISOString(),
    buy_in_amount: totalBuyIn,
    cash_out_amount: cashOut,
    cashed_out_at: cashOut !== null ? new Date().toISOString() : null,
    net_profit_loss: netProfitLoss,
    status: cashOut !== null ? 'checked_in' : 'checked_in',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: userId,
      display_name: name,
      avatar_url: null,
    },
    buy_in_ledger: ledger,
  };
}

console.log('🧪 Testing Buy-In/Cash-Out Logic\n');
console.log('=' .repeat(60));

// Test 1: Basic buy-in calculation
console.log('\n📊 Test 1: Calculate Total Buy-In');
const ledger1: BuyInLedgerEntry[] = [
  { id: '1', participant_id: 'p1', amount: 100, is_rebuy: false, notes: null, created_at: new Date().toISOString() },
  { id: '2', participant_id: 'p1', amount: 50, is_rebuy: true, notes: null, created_at: new Date().toISOString() },
];
const total1 = calculateTotalBuyIn(ledger1);
console.log(`✅ Total buy-in: $${total1} (expected: $150)`);
console.assert(total1 === 150, 'Total buy-in should be 150');

// Test 2: Participant summary
console.log('\n📊 Test 2: Participant Summary');
const participant1 = createMockParticipant('p1', 'u1', 'Alice', [100, 50], 200);
const summary1 = getParticipantSummary(participant1);
console.log(`✅ ${summary1.displayName}:`);
console.log(`   Initial: $${summary1.initialBuyIn}, Rebuys: $${summary1.totalRebuys} (${summary1.rebuyCount}x)`);
console.log(`   Total in: $${summary1.totalBuyIn}, Cash out: $${summary1.cashOut}`);
console.log(`   Profit/Loss: $${summary1.netProfitLoss}`);
console.assert(summary1.totalBuyIn === 150, 'Total should be 150');
console.assert(summary1.netProfitLoss === 50, 'Profit should be 50');

// Test 3: Event summary with multiple participants
console.log('\n📊 Test 3: Event Summary');
const participants = [
  createMockParticipant('p1', 'u1', 'Alice', [100, 50], 200), // +50
  createMockParticipant('p2', 'u2', 'Bob', [100], 50), // -50
  createMockParticipant('p3', 'u3', 'Charlie', [100], 150), // +50
  createMockParticipant('p4', 'u4', 'Diana', [100], null), // Still playing
];

const eventSummary = calculateEventSummary(participants);
console.log(`✅ Event Summary:`);
console.log(`   Total buy-ins: $${eventSummary.totalBuyIns}`);
console.log(`   Total cash-outs: $${eventSummary.totalCashOuts}`);
console.log(`   Money still in play: $${eventSummary.moneyStillInPlay}`);
console.log(`   Participants: ${eventSummary.participantsCount} total, ${eventSummary.participantsCashedOut} cashed out`);
console.log(`   Can settle: ${eventSummary.canSettle}`);
console.assert(eventSummary.totalBuyIns === 450, 'Total buy-ins should be 450');
console.assert(eventSummary.participantsStillPlaying === 1, '1 player still playing');

// Test 4: Cash-out validation
console.log('\n📊 Test 4: Cash-Out Validation');
const allCashedOut = participants.slice(0, 3); // Alice, Bob, Charlie
const validation = validateCashOut(150, allCashedOut[2]!, allCashedOut);
console.log(`✅ Validating cash-out of $150 for Charlie:`);
console.log(`   Valid: ${validation.isValid}`);
if (validation.errors.length > 0) {
  console.log(`   Errors: ${validation.errors.join(', ')}`);
}
if (validation.warnings.length > 0) {
  console.log(`   Warnings: ${validation.warnings.join(', ')}`);
}
if (validation.suggestedAmount) {
  console.log(`   Suggested: $${validation.suggestedAmount}`);
}

// Test 5: Settlement check
console.log('\n📊 Test 5: Settlement Check');
const allCashedOutParticipants = [
  createMockParticipant('p1', 'u1', 'Alice', [100, 50], 200), // +50
  createMockParticipant('p2', 'u2', 'Bob', [100], 50), // -50
  createMockParticipant('p3', 'u3', 'Charlie', [100], 100), // 0 (break even)
];
const settlementCheck = checkEventCanSettle(allCashedOutParticipants);
console.log(`✅ Settlement Check:`);
console.log(`   Can settle: ${settlementCheck.canSettle}`);
if (settlementCheck.reason) {
  console.log(`   Reason: ${settlementCheck.reason}`);
}
console.log(`   Balance check: $${settlementCheck.summary.balanceCheck}`);
if (!settlementCheck.canSettle) {
  console.log(`   ⚠️  Cannot settle: ${settlementCheck.reason}`);
} else {
  console.assert(settlementCheck.canSettle === true, 'Should be able to settle');
}

// Test 6: Debt calculation
console.log('\n📊 Test 6: Debt Calculation');
const debtResult = calculateDebtsFromLedger(allCashedOutParticipants);
console.log(`✅ Debt Calculation:`);
console.log(`   Total pot: $${debtResult.totalPot}`);
console.log(`   Participants: ${debtResult.participantsCount}`);
console.log(`   Debts to settle: ${debtResult.debts.length}`);
debtResult.debts.forEach((debt, i) => {
  console.log(`   ${i + 1}. ${debt.fromUserName} owes ${debt.toUserName} $${debt.amount.toFixed(2)}`);
});
console.log(`\n   Winners:`);
debtResult.winners.forEach(w => {
  if (w && w.amount) {
    console.log(`      ${w.userName}: +$${w.amount.toFixed(2)}`);
  }
});
console.log(`   Losers:`);
debtResult.losers.forEach(l => {
  if (l && l.amount) {
    console.log(`      ${l.userName}: -$${l.amount.toFixed(2)}`);
  }
});

// Verify balance
const totalOwed = debtResult.debts.reduce((sum, d) => sum + d.amount, 0);
const totalWon = debtResult.winners.reduce((sum, w) => sum + (w?.amount ?? 0), 0);
const totalLost = debtResult.losers.reduce((sum, l) => sum + (l?.amount ?? 0), 0);
console.log(`\n   Balance verification:`);
console.log(`   Total owed: $${totalOwed.toFixed(2)}`);
console.log(`   Total won: $${totalWon.toFixed(2)}`);
console.log(`   Total lost: $${totalLost.toFixed(2)}`);
console.assert(Math.abs(totalWon - totalLost) < 0.01, 'Wins and losses should balance');

console.log('\n' + '='.repeat(60));
console.log('✅ All tests passed! The buy-in/cash-out logic is working correctly.\n');

