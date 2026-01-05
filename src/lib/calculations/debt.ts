/**
 * Debt Calculation Algorithm
 * 
 * This module contains the core algorithm for calculating who owes whom
 * after a poker game. The algorithm minimizes the number of transactions
 * needed to settle all debts.
 * 
 * How it works:
 * 1. Calculate net profit/loss for each participant
 * 2. Split participants into winners (positive) and losers (negative)
 * 3. Match losers with winners using greedy algorithm to minimize transactions
 * 
 * The greedy approach pairs the biggest loser with the biggest winner,
 * settling as much as possible before moving to the next pair.
 * This typically results in N-1 transactions for N participants.
 */

import type { EventParticipant, Profile, ParticipantWithLedger } from '@/types';

/**
 * Represents a debt between two users
 */
export interface Debt {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

/**
 * Participant with profile info for debt calculation
 */
export interface ParticipantWithProfile extends EventParticipant {
  profile: Pick<Profile, 'id' | 'display_name'>;
}

/**
 * Result of debt calculation
 */
export interface DebtCalculationResult {
  debts: Debt[];
  totalPot: number;
  participantsCount: number;
  balanceCheck: number; // Should be 0 if math is correct
  winners: { userId: string; userName: string; profit: number }[];
  losers: { userId: string; userName: string; loss: number }[];
}

/**
 * Calculate the net profit/loss for each participant
 */
export function calculateNetProfitLoss(
  buyIn: number,
  cashOut: number | null
): number {
  if (cashOut === null) return 0;
  return cashOut - buyIn;
}

/**
 * Main debt calculation function
 * 
 * Takes a list of participants with their buy-ins and cash-outs,
 * and returns the optimal list of debts to settle.
 * 
 * @example
 * ```ts
 * const result = calculateDebts(participants);
 * // result.debts = [
 * //   { fromUserId: 'alice', toUserId: 'bob', amount: 50 },
 * //   { fromUserId: 'charlie', toUserId: 'bob', amount: 30 }
 * // ]
 * ```
 */
export function calculateDebts(
  participants: ParticipantWithProfile[]
): DebtCalculationResult {
  // Filter out participants who haven't cashed out yet
  const completedParticipants = participants.filter(
    (p) => p.cash_out_amount !== null
  );

  if (completedParticipants.length === 0) {
    return {
      debts: [],
      totalPot: 0,
      participantsCount: 0,
      balanceCheck: 0,
    };
  }

  // Calculate total pot (sum of all buy-ins)
  const totalPot = completedParticipants.reduce(
    (sum, p) => sum + p.buy_in_amount,
    0
  );

  // Calculate net profit/loss for each participant
  const balances = completedParticipants.map((p) => ({
    userId: p.user_id,
    userName: p.profile.display_name || 'Unknown',
    balance: calculateNetProfitLoss(p.buy_in_amount, p.cash_out_amount),
  }));

  // Verify that total balance is 0 (conservation of money)
  const balanceCheck = balances.reduce((sum, b) => sum + b.balance, 0);

  // Separate into winners (positive balance) and losers (negative balance)
  const winners = balances
    .filter((b) => b.balance > 0)
    .sort((a, b) => b.balance - a.balance); // Sort descending

  const losers = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ ...b, balance: Math.abs(b.balance) })) // Make balance positive
    .sort((a, b) => b.balance - a.balance); // Sort descending

  // Calculate optimal debts using greedy algorithm
  const debts: Debt[] = [];
  
  let winnerIndex = 0;
  let loserIndex = 0;
  
  // Create copies of balances that we can modify
  const winnerBalances = winners.map((w) => w.balance);
  const loserBalances = losers.map((l) => l.balance);

  while (winnerIndex < winners.length && loserIndex < losers.length) {
    const winner = winners[winnerIndex];
    const loser = losers[loserIndex];
    const winnerBalance = winnerBalances[winnerIndex];
    const loserBalance = loserBalances[loserIndex];

    if (winnerBalance === undefined || loserBalance === undefined) break;
    if (winner === undefined || loser === undefined) break;

    // Calculate the amount to transfer
    const amount = Math.min(winnerBalance, loserBalance);

    if (amount > 0.01) { // Only create debt if > 1 cent
      debts.push({
        fromUserId: loser.userId,
        fromUserName: loser.userName,
        toUserId: winner.userId,
        toUserName: winner.userName,
        amount: roundToTwoDecimals(amount),
      });
    }

    // Update remaining balances
    winnerBalances[winnerIndex] = winnerBalance - amount;
    loserBalances[loserIndex] = loserBalance - amount;

    // Move to next participant if their balance is settled
    if (winnerBalances[winnerIndex]! < 0.01) {
      winnerIndex++;
    }
    if (loserBalances[loserIndex]! < 0.01) {
      loserIndex++;
    }
  }

  return {
    debts,
    totalPot: roundToTwoDecimals(totalPot),
    participantsCount: completedParticipants.length,
    balanceCheck: roundToTwoDecimals(balanceCheck),
    winners: winners.map(w => ({
      userId: w.userId,
      userName: w.userName,
      profit: roundToTwoDecimals(balances.find(b => b.userId === w.userId)?.balance ?? 0),
    })),
    losers: losers.map(l => ({
      userId: l.userId,
      userName: l.userName,
      loss: roundToTwoDecimals(l.balance),
    })),
  };
}

/**
 * Calculate debts from participants with ledger data
 * This version works with the new buy_in_ledger system
 */
export function calculateDebtsFromLedger(
  participants: ParticipantWithLedger[]
): DebtCalculationResult {
  // Convert to the format expected by calculateDebts
  const participantsWithProfile: ParticipantWithProfile[] = participants.map(p => ({
    ...p,
    profile: {
      id: p.profile.id,
      display_name: p.profile.display_name,
    },
  }));
  
  return calculateDebts(participantsWithProfile);
}

/**
 * Round a number to 2 decimal places
 */
function roundToTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Format debts as a human-readable summary
 */
export function formatDebtSummary(debts: Debt[]): string {
  if (debts.length === 0) {
    return 'No debts to settle!';
  }

  return debts
    .map(
      (d) =>
        `${d.fromUserName} owes ${d.toUserName} $${d.amount.toFixed(2)}`
    )
    .join('\n');
}

/**
 * Get total amount owed by a specific user
 */
export function getTotalOwed(debts: Debt[], userId: string): number {
  return debts
    .filter((d) => d.fromUserId === userId)
    .reduce((sum, d) => sum + d.amount, 0);
}

/**
 * Get total amount owed to a specific user
 */
export function getTotalOwedTo(debts: Debt[], userId: string): number {
  return debts
    .filter((d) => d.toUserId === userId)
    .reduce((sum, d) => sum + d.amount, 0);
}

/**
 * Get all debts involving a specific user (either as debtor or creditor)
 */
export function getDebtsForUser(debts: Debt[], userId: string): Debt[] {
  return debts.filter(
    (d) => d.fromUserId === userId || d.toUserId === userId
  );
}

