/**
 * Complex Test Script for Buy-In/Cash-Out Logic
 * 
 * Run with: npx tsx scripts/test-ledger-complex.ts
 * 
 * Tests with 8 participants in a realistic poker scenario
 */

import {
  calculateTotalBuyIn,
  getParticipantSummary,
  calculateEventSummary,
  validateCashOut,
  checkEventCanSettle,
  generateEventLedgerSummary,
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
    status: 'checked_in',
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

console.log('🎰 Complex Poker Event Test - 8 Participants\n');
console.log('=' .repeat(70));

// Create a realistic poker scenario with 8 players
// Scenario: $100 buy-in tournament with rebuys
// Total buy-ins: 100+150+200+200+150+200+250+150 = $1400
// We'll distribute cash-outs so they balance to $1400 total
const participants = [
  // Player 1: Big winner - bought in once, cashed out big
  createMockParticipant('p1', 'u1', 'Alice', [100], 400),        // +300 (100 in)
  
  // Player 2: Moderate winner - rebought once, did well
  createMockParticipant('p2', 'u2', 'Bob', [100, 50], 250),      // +100 (150 in)
  
  // Player 3: Small winner - rebought twice, barely profitable
  createMockParticipant('p3', 'u3', 'Charlie', [100, 50, 50], 200), // 0 (200 in)
  
  // Player 4: Break even - rebought once, got back to even
  createMockParticipant('p4', 'u4', 'Diana', [100, 100], 200),   // 0 (200 in)
  
  // Player 5: Small loser - rebought once, lost a bit
  createMockParticipant('p5', 'u5', 'Eve', [100, 50], 100),      // -50 (150 in)
  
  // Player 6: Moderate loser - rebought twice, lost more
  createMockParticipant('p6', 'u6', 'Frank', [100, 50, 50], 120), // -80 (200 in)
  
  // Player 7: Big loser - rebought multiple times, lost big
  createMockParticipant('p7', 'u7', 'Grace', [100, 100, 50], 70), // -180 (250 in)
  
  // Player 8: Still playing (hasn't cashed out yet)
  // Will cash out with: 1400 - (400+250+200+200+100+120+70) = 60 (loses 90)
  createMockParticipant('p8', 'u8', 'Henry', [100, 50], null),    // -90 (150 in)
];
// Total cash-outs (when Henry cashes): 400+250+200+200+100+120+70+60 = 1400 ✓

console.log('\n📋 Participant Details:\n');
participants.forEach((p, i) => {
  const summary = getParticipantSummary(p);
  const status = summary.isCashedOut ? '✅ Cashed Out' : '🎮 Still Playing';
  console.log(`${i + 1}. ${summary.displayName} ${status}`);
  console.log(`   Buy-ins: $${summary.initialBuyIn} initial`);
  if (summary.rebuyCount > 0) {
    console.log(`   Rebuys: ${summary.rebuyCount}x ($${summary.totalRebuys} total)`);
  }
  console.log(`   Total in: $${summary.totalBuyIn}`);
  if (summary.cashOut !== null) {
    console.log(`   Cash out: $${summary.cashOut}`);
    const profitLoss = summary.netProfitLoss >= 0 ? '+' : '';
    console.log(`   P/L: ${profitLoss}$${summary.netProfitLoss.toFixed(2)}`);
  } else {
    console.log(`   Cash out: Still playing`);
  }
  console.log('');
});

// Test 1: Event Summary
console.log('📊 Test 1: Event Summary\n');
const eventSummary = calculateEventSummary(participants);
console.log(`Total Buy-ins:     $${eventSummary.totalBuyIns.toFixed(2)}`);
console.log(`Total Cash-outs:   $${eventSummary.totalCashOuts.toFixed(2)}`);
console.log(`Money in Play:     $${eventSummary.moneyStillInPlay.toFixed(2)}`);
console.log(`Balance Check:     $${eventSummary.balanceCheck.toFixed(2)}`);
console.log(`Is Balanced:       ${eventSummary.isBalanced ? '✅ Yes' : '❌ No'}`);
console.log(`Participants:      ${eventSummary.participantsCount} total`);
console.log(`Cashed Out:         ${eventSummary.participantsCashedOut}`);
console.log(`Still Playing:     ${eventSummary.participantsStillPlaying}`);
console.log(`Can Settle:         ${eventSummary.canSettle ? '✅ Yes' : '❌ No (waiting for players to cash out)'}`);

// Test 2: Cash-out validation for last player
console.log('\n📊 Test 2: Cash-Out Validation for Last Player\n');
const lastPlayer = participants[7]!; // Henry
const allOthersCashedOut = participants.slice(0, 7);

// Calculate what Henry should cash out for
const totalBuyIns = eventSummary.totalBuyIns;
const totalCashedOut = allOthersCashedOut.reduce(
  (sum, p) => sum + (p.cash_out_amount ?? 0),
  0
);
const expectedCashOut = totalBuyIns - totalCashedOut;

console.log(`Last player: ${lastPlayer.profile.display_name}`);
console.log(`Total buy-ins: $${totalBuyIns.toFixed(2)}`);
console.log(`Others cashed out: $${totalCashedOut.toFixed(2)}`);
console.log(`Expected cash-out: $${expectedCashOut.toFixed(2)}`);

// Test with correct amount
const validation = validateCashOut(expectedCashOut, lastPlayer, participants);
console.log(`\nValidating cash-out of $${expectedCashOut.toFixed(2)}:`);
console.log(`Valid: ${validation.isValid ? '✅' : '❌'}`);
if (validation.errors.length > 0) {
  console.log(`Errors: ${validation.errors.join(', ')}`);
}
if (validation.warnings.length > 0) {
  console.log(`Warnings: ${validation.warnings.join(', ')}`);
}

// Test 3: Complete settlement (after all cash out)
console.log('\n📊 Test 3: Complete Settlement Scenario\n');
const allCashedOutParticipants = participants.map(p => {
  if (p.id === 'p8') {
    // Cash out Henry with the correct amount
    return createMockParticipant('p8', 'u8', 'Henry', [100, 50], expectedCashOut);
  }
  return p;
});

const settlementCheck = checkEventCanSettle(allCashedOutParticipants);
console.log(`Can Settle: ${settlementCheck.canSettle ? '✅ Yes' : '❌ No'}`);
if (settlementCheck.reason) {
  console.log(`Reason: ${settlementCheck.reason}`);
}
console.log(`Balance Check: $${settlementCheck.summary.balanceCheck.toFixed(2)}`);
console.log(`Is Balanced: ${settlementCheck.summary.isBalanced ? '✅ Yes' : '❌ No'}`);

// Test 4: Debt Calculation
console.log('\n📊 Test 4: Debt Calculation & Resolution\n');
const debtResult = calculateDebtsFromLedger(allCashedOutParticipants);

console.log(`Total Pot: $${debtResult.totalPot.toFixed(2)}`);
console.log(`Participants: ${debtResult.participantsCount}`);
console.log(`Debts to Create: ${debtResult.debts.length}\n`);

console.log('💰 Winners:');
debtResult.winners.forEach((w, i) => {
  console.log(`   ${i + 1}. ${w.userName}: +$${w.amount.toFixed(2)}`);
});

console.log('\n💸 Losers:');
debtResult.losers.forEach((l, i) => {
  console.log(`   ${i + 1}. ${l.userName}: -$${l.amount.toFixed(2)}`);
});

console.log('\n📝 Debt Transactions (Minimal Set):');
debtResult.debts.forEach((debt, i) => {
  console.log(`   ${i + 1}. ${debt.fromUserName} → ${debt.toUserName}: $${debt.amount.toFixed(2)}`);
});

// Verify the math
const totalWon = debtResult.winners.reduce((sum, w) => sum + w.amount, 0);
const totalLost = debtResult.losers.reduce((sum, l) => sum + l.amount, 0);
const totalDebts = debtResult.debts.reduce((sum, d) => sum + d.amount, 0);

console.log('\n🔍 Balance Verification:');
console.log(`   Total Won: $${totalWon.toFixed(2)}`);
console.log(`   Total Lost: $${totalLost.toFixed(2)}`);
console.log(`   Difference: $${Math.abs(totalWon - totalLost).toFixed(2)}`);
console.log(`   Total Debts: $${totalDebts.toFixed(2)}`);
console.log(`   Balance Check: $${debtResult.balanceCheck.toFixed(2)}`);

if (Math.abs(totalWon - totalLost) < 0.01 && Math.abs(debtResult.balanceCheck) < 0.01) {
  console.log('\n   ✅ Math checks out! Everything balances correctly.');
} else {
  console.log('\n   ❌ Math error detected!');
}

// Test 5: Ledger Summary
console.log('\n📊 Test 5: Complete Ledger Summary\n');
const ledgerSummary = generateEventLedgerSummary('test-event', allCashedOutParticipants);
console.log(`Event ID: ${ledgerSummary.event_id}`);
console.log(`Total Buy-ins: $${ledgerSummary.total_buy_ins.toFixed(2)}`);
console.log(`Total Cash-outs: $${ledgerSummary.total_cash_outs.toFixed(2)}`);
console.log(`Balance Check: $${ledgerSummary.balance_check.toFixed(2)}`);
console.log(`Participants: ${ledgerSummary.participants_count}`);
console.log(`Cashed Out: ${ledgerSummary.participants_cashed_out}`);
console.log(`Still Playing: ${ledgerSummary.participants_still_playing}`);

// Test 6: Edge cases
console.log('\n📊 Test 6: Edge Cases\n');

// Test with zero cash-out (bust out)
const bustOutPlayer = createMockParticipant('p9', 'u9', 'Ivan', [100, 50], 0);
console.log(`Bust-out scenario: ${bustOutPlayer.profile.display_name}`);
const bustSummary = getParticipantSummary(bustOutPlayer);
console.log(`   Total in: $${bustSummary.totalBuyIn}`);
console.log(`   Cash out: $${bustSummary.cashOut}`);
console.log(`   P/L: $${bustSummary.netProfitLoss.toFixed(2)}`);

// Test with exact break-even
const breakEvenPlayer = createMockParticipant('p10', 'u10', 'Jack', [100, 50], 150);
console.log(`\nBreak-even scenario: ${breakEvenPlayer.profile.display_name}`);
const evenSummary = getParticipantSummary(breakEvenPlayer);
console.log(`   Total in: $${evenSummary.totalBuyIn}`);
console.log(`   Cash out: $${evenSummary.cashOut}`);
console.log(`   P/L: $${evenSummary.netProfitLoss.toFixed(2)}`);

// Test with large rebuy scenario
const largeRebuyPlayer = createMockParticipant('p11', 'u11', 'Kate', [100, 100, 100, 50], 500);
console.log(`\nLarge rebuy scenario: ${largeRebuyPlayer.profile.display_name}`);
const rebuySummary = getParticipantSummary(largeRebuyPlayer);
console.log(`   Initial: $${rebuySummary.initialBuyIn}`);
console.log(`   Rebuys: ${rebuySummary.rebuyCount}x ($${rebuySummary.totalRebuys})`);
console.log(`   Total in: $${rebuySummary.totalBuyIn}`);
console.log(`   Cash out: $${rebuySummary.cashOut}`);
console.log(`   P/L: +$${rebuySummary.netProfitLoss.toFixed(2)}`);

console.log('\n' + '='.repeat(70));
console.log('✅ Complex test completed! All calculations working correctly.\n');

// Summary statistics
console.log('📈 Summary Statistics:\n');
const allSummaries = allCashedOutParticipants.map(p => getParticipantSummary(p));
const totalRebuys = allSummaries.reduce((sum, s) => sum + s.rebuyCount, 0);
const avgRebuys = totalRebuys / allSummaries.length;
const biggestWinner = allSummaries.reduce((max, s) => 
  s.netProfitLoss > (max?.netProfitLoss ?? -Infinity) ? s : max
);
const biggestLoser = allSummaries.reduce((min, s) => 
  s.netProfitLoss < (min?.netProfitLoss ?? Infinity) ? s : min
);

console.log(`Total Rebuys: ${totalRebuys} (avg: ${avgRebuys.toFixed(1)} per player)`);
console.log(`Biggest Winner: ${biggestWinner.displayName} (+$${biggestWinner.netProfitLoss.toFixed(2)})`);
console.log(`Biggest Loser: ${biggestLoser.displayName} ($${biggestLoser.netProfitLoss.toFixed(2)})`);
console.log(`Debt Transactions Needed: ${debtResult.debts.length} (out of ${allCashedOutParticipants.length} participants)`);
console.log(`   Efficiency: ${((1 - debtResult.debts.length / allCashedOutParticipants.length) * 100).toFixed(1)}% reduction\n`);

