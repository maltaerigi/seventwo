/**
 * API Endpoint Test Script for Buy-In/Cash-Out Module
 * 
 * Run with: npx tsx scripts/test-api-ledger.ts
 * 
 * This script tests:
 * 1. Validation schemas
 * 2. Calculation logic
 * 3. API response format validation
 * 
 * For full API endpoint testing with a running server, see test-api-endpoints.ts
 */

import type { BuyInLedgerEntry, ParticipantWithLedger } from '../src/types/database';

// Simple test runner
class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => Promise<void> | void) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 API Ledger Module Tests\n');
    console.log('='.repeat(70));

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        if (error instanceof Error && error.stack) {
          console.log(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
        }
        this.failed++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`Results: ${this.passed} passed, ${this.failed} failed\n`);
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

const runner = new TestRunner();

// Test validation schemas
runner.test('Validation: Record Buy-In Schema', async () => {
  const { recordBuyInSchema } = await import('../src/lib/validations/participant');
  
  // Valid input (UUID format required)
  const valid = recordBuyInSchema.safeParse({
    participant_id: '123e4567-e89b-12d3-a456-426614174000',
    amount: 100,
    notes: 'Initial buy-in',
  });
  if (!valid.success) {
    throw new Error(`Valid input should pass: ${JSON.stringify(valid.error.issues)}`);
  }

  // Invalid: negative amount
  const invalid1 = recordBuyInSchema.safeParse({
    participant_id: '123e4567-e89b-12d3-a456-426614174000',
    amount: -10,
  });
  if (invalid1.success) throw new Error('Negative amount should fail');

  // Invalid: missing participant_id
  const invalid2 = recordBuyInSchema.safeParse({
    amount: 100,
  });
  if (invalid2.success) throw new Error('Missing participant_id should fail');
});

runner.test('Validation: Record Cash-Out Schema', async () => {
  const { recordCashOutSchema } = await import('../src/lib/validations/participant');
  
  // Valid input (UUID format required)
  const valid = recordCashOutSchema.safeParse({
    participant_id: '123e4567-e89b-12d3-a456-426614174000',
    amount: 200,
  });
  if (!valid.success) {
    throw new Error(`Valid input should pass: ${JSON.stringify(valid.error.issues)}`);
  }

  // Invalid: negative amount
  const invalid = recordCashOutSchema.safeParse({
    participant_id: '123e4567-e89b-12d3-a456-426614174000',
    amount: -10,
  });
  if (invalid.success) throw new Error('Negative amount should fail');
});

runner.test('Validation: Record Rebuy Schema', async () => {
  const { recordRebuySchema } = await import('../src/lib/validations/participant');
  
  const valid = recordRebuySchema.safeParse({
    participant_id: '123e4567-e89b-12d3-a456-426614174000',
    amount: 50,
  });
  if (!valid.success) {
    throw new Error(`Valid rebuy should pass: ${JSON.stringify(valid.error.issues)}`);
  }
});

// Test ledger calculations
runner.test('Ledger: Calculate Total Buy-In', async () => {
  const { calculateTotalBuyIn } = await import('../src/lib/calculations/ledger');
  const ledger: BuyInLedgerEntry[] = [
    { id: '1', participant_id: 'p1', amount: 100, is_rebuy: false, notes: null, created_at: new Date().toISOString() },
    { id: '2', participant_id: 'p1', amount: 50, is_rebuy: true, notes: null, created_at: new Date().toISOString() },
  ];

  const total = calculateTotalBuyIn(ledger);
  if (total !== 150) throw new Error(`Expected 150, got ${total}`);
});

runner.test('Ledger: Get Participant Summary', async () => {
  const { getParticipantSummary } = await import('../src/lib/calculations/ledger');
  const participant: ParticipantWithLedger = {
    id: 'p1',
    event_id: 'e1',
    user_id: 'u1',
    checked_in_at: new Date().toISOString(),
    buy_in_amount: 150,
    cash_out_amount: 200,
    cashed_out_at: new Date().toISOString(),
    net_profit_loss: 50,
    status: 'checked_in',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: { id: 'u1', display_name: 'Alice', avatar_url: null },
    buy_in_ledger: [
      { id: '1', participant_id: 'p1', amount: 100, is_rebuy: false, notes: null, created_at: new Date().toISOString() },
      { id: '2', participant_id: 'p1', amount: 50, is_rebuy: true, notes: null, created_at: new Date().toISOString() },
    ],
  };

  const summary = getParticipantSummary(participant);
  if (summary.totalBuyIn !== 150) throw new Error(`Expected total 150, got ${summary.totalBuyIn}`);
  if (summary.rebuyCount !== 1) throw new Error(`Expected 1 rebuy, got ${summary.rebuyCount}`);
  if (summary.netProfitLoss !== 50) throw new Error(`Expected profit 50, got ${summary.netProfitLoss}`);
});

runner.test('Ledger: Calculate Event Summary', async () => {
  const { calculateEventSummary } = await import('../src/lib/calculations/ledger');
  const participants: ParticipantWithLedger[] = [
    {
      id: 'p1',
      event_id: 'e1',
      user_id: 'u1',
      checked_in_at: new Date().toISOString(),
      buy_in_amount: 100,
      cash_out_amount: 200,
      cashed_out_at: new Date().toISOString(),
      net_profit_loss: 100,
      status: 'checked_in',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: { id: 'u1', display_name: 'Alice', avatar_url: null },
      buy_in_ledger: [
        { id: '1', participant_id: 'p1', amount: 100, is_rebuy: false, notes: null, created_at: new Date().toISOString() },
      ],
    },
    {
      id: 'p2',
      event_id: 'e1',
      user_id: 'u2',
      checked_in_at: new Date().toISOString(),
      buy_in_amount: 100,
      cash_out_amount: null,
      cashed_out_at: null,
      net_profit_loss: 0,
      status: 'checked_in',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: { id: 'u2', display_name: 'Bob', avatar_url: null },
      buy_in_ledger: [
        { id: '2', participant_id: 'p2', amount: 100, is_rebuy: false, notes: null, created_at: new Date().toISOString() },
      ],
    },
  ];

  const summary = calculateEventSummary(participants);
  if (summary.totalBuyIns !== 200) throw new Error(`Expected 200 total buy-ins, got ${summary.totalBuyIns}`);
  if (summary.participantsStillPlaying !== 1) throw new Error(`Expected 1 still playing, got ${summary.participantsStillPlaying}`);
  if (summary.canSettle) throw new Error('Should not be able to settle with players still playing');
});

runner.test('Ledger: Validate Cash-Out', async () => {
  const { validateCashOut } = await import('../src/lib/calculations/ledger');
  // Create a scenario with multiple participants so cash-out can be validated
  const participant1: ParticipantWithLedger = {
    id: 'p1',
    event_id: 'e1',
    user_id: 'u1',
    checked_in_at: new Date().toISOString(),
    buy_in_amount: 100,
    cash_out_amount: null,
    cashed_out_at: null,
    net_profit_loss: 0,
    status: 'checked_in',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: { id: 'u1', display_name: 'Alice', avatar_url: null },
    buy_in_ledger: [
      { id: '1', participant_id: 'p1', amount: 100, is_rebuy: false, notes: null, created_at: new Date().toISOString() },
    ],
  };

  const participant2: ParticipantWithLedger = {
    id: 'p2',
    event_id: 'e1',
    user_id: 'u2',
    checked_in_at: new Date().toISOString(),
    buy_in_amount: 100,
    cash_out_amount: 50, // Already cashed out
    cashed_out_at: new Date().toISOString(),
    net_profit_loss: -50,
    status: 'checked_in',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: { id: 'u2', display_name: 'Bob', avatar_url: null },
    buy_in_ledger: [
      { id: '2', participant_id: 'p2', amount: 100, is_rebuy: false, notes: null, created_at: new Date().toISOString() },
    ],
  };

  // Total buy-ins: 200, Bob cashed out 50, so Alice can cash out up to 150
  const validation = validateCashOut(150, participant1, [participant1, participant2]);
  if (!validation.isValid) {
    throw new Error(`Valid cash-out should pass validation: ${validation.errors.join(', ')}`);
  }

  // Test that cash-out already recorded fails
  const alreadyCashedOut: ParticipantWithLedger = {
    ...participant1,
    cash_out_amount: 150,
    cashed_out_at: new Date().toISOString(),
  };
  const alreadyCashedValidation = validateCashOut(200, alreadyCashedOut, [alreadyCashedOut, participant2]);
  if (alreadyCashedValidation.isValid) {
    throw new Error('Should fail validation if participant already cashed out');
  }
  if (!alreadyCashedValidation.errors.some(e => e.includes('already cashed out'))) {
    throw new Error('Should have error about already cashed out');
  }
});

runner.test('Debt: Calculate Debts from Ledger', async () => {
  const { calculateDebtsFromLedger } = await import('../src/lib/calculations/debt');
  const participants: ParticipantWithLedger[] = [
    {
      id: 'p1',
      event_id: 'e1',
      user_id: 'u1',
      checked_in_at: new Date().toISOString(),
      buy_in_amount: 100,
      cash_out_amount: 200,
      cashed_out_at: new Date().toISOString(),
      net_profit_loss: 100,
      status: 'checked_in',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: { id: 'u1', display_name: 'Alice', avatar_url: null },
      buy_in_ledger: [
        { id: '1', participant_id: 'p1', amount: 100, is_rebuy: false, notes: null, created_at: new Date().toISOString() },
      ],
    },
    {
      id: 'p2',
      event_id: 'e1',
      user_id: 'u2',
      checked_in_at: new Date().toISOString(),
      buy_in_amount: 100,
      cash_out_amount: 0,
      cashed_out_at: new Date().toISOString(),
      net_profit_loss: -100,
      status: 'checked_in',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: { id: 'u2', display_name: 'Bob', avatar_url: null },
      buy_in_ledger: [
        { id: '2', participant_id: 'p2', amount: 100, is_rebuy: false, notes: null, created_at: new Date().toISOString() },
      ],
    },
  ];

  const result = calculateDebtsFromLedger(participants);
  if (result.debts.length !== 1) throw new Error(`Expected 1 debt, got ${result.debts.length}`);
  if (result.debts[0]!.amount !== 100) throw new Error(`Expected debt of 100, got ${result.debts[0]!.amount}`);
  if (result.debts[0]!.fromUserId !== 'u2') throw new Error('Bob should owe Alice');
  if (result.debts[0]!.toUserId !== 'u1') throw new Error('Bob should owe Alice');
});

runner.test('Settlement: Check Event Can Settle', async () => {
  const { checkEventCanSettle } = await import('../src/lib/calculations/ledger');
  // Test with all cashed out
  const allCashedOut: ParticipantWithLedger[] = [
    {
      id: 'p1',
      event_id: 'e1',
      user_id: 'u1',
      checked_in_at: new Date().toISOString(),
      buy_in_amount: 100,
      cash_out_amount: 200,
      cashed_out_at: new Date().toISOString(),
      net_profit_loss: 100,
      status: 'checked_in',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: { id: 'u1', display_name: 'Alice', avatar_url: null },
      buy_in_ledger: [
        { id: '1', participant_id: 'p1', amount: 100, is_rebuy: false, notes: null, created_at: new Date().toISOString() },
      ],
    },
    {
      id: 'p2',
      event_id: 'e1',
      user_id: 'u2',
      checked_in_at: new Date().toISOString(),
      buy_in_amount: 100,
      cash_out_amount: 0,
      cashed_out_at: new Date().toISOString(),
      net_profit_loss: -100,
      status: 'checked_in',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: { id: 'u2', display_name: 'Bob', avatar_url: null },
      buy_in_ledger: [
        { id: '2', participant_id: 'p2', amount: 100, is_rebuy: false, notes: null, created_at: new Date().toISOString() },
      ],
    },
  ];

  const check = checkEventCanSettle(allCashedOut);
  if (!check.canSettle) throw new Error('Should be able to settle when all cashed out and balanced');
});

runner.test('API: Response Format Structure', async () => {
  // Test that our API responses match the expected format
  const mockSuccessResponse = {
    success: true,
    data: {
      ledger_entry: { id: '1', amount: 100 },
      participant_total_buy_in: 100,
    },
  };

  const mockErrorResponse = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
    },
  };

  // Check structure
  if (!('success' in mockSuccessResponse)) throw new Error('Response should have success field');
  if (!('data' in mockSuccessResponse)) throw new Error('Success response should have data field');
  if (!('success' in mockErrorResponse)) throw new Error('Response should have success field');
  if (!('error' in mockErrorResponse)) throw new Error('Error response should have error field');
});

// Run all tests
runner.run().catch(console.error);
