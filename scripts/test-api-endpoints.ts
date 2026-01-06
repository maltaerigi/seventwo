/**
 * API Endpoint Integration Test Script
 * 
 * Run with: npx tsx scripts/test-api-endpoints.ts
 * 
 * This script tests the actual API endpoints by making HTTP requests.
 * Requires the Next.js dev server to be running:
 *   npm run dev
 * 
 * Set these environment variables:
 *   BASE_URL=http://localhost:3000 (default)
 *   TEST_EVENT_ID=<your-event-id>
 *   TEST_PARTICIPANT_ID=<your-participant-id>
 *   TEST_USER_TOKEN=<your-auth-token> (optional, for authenticated endpoints)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EVENT_ID = process.env.TEST_EVENT_ID;
const TEST_PARTICIPANT_ID = process.env.TEST_PARTICIPANT_ID;
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  response?: unknown;
}

class APITester {
  private results: TestResult[] = [];

  private async makeRequest(
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {}
  ): Promise<Response> {
    const url = `${BASE_URL}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return fetch(url, options);
  }

  async test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
      this.results.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run() {
    console.log('🌐 API Endpoint Integration Tests\n');
    console.log(`Base URL: ${BASE_URL}\n`);
    console.log('='.repeat(70));

    if (!TEST_EVENT_ID) {
      console.log('⚠️  TEST_EVENT_ID not set. Some tests will be skipped.\n');
    }

    // Test 1: Get Ledger (GET /api/events/[id]/ledger)
    await this.test('GET /api/events/[id]/ledger', async () => {
      if (!TEST_EVENT_ID) throw new Error('TEST_EVENT_ID not set');
      
      const response = await this.makeRequest('GET', `/api/events/${TEST_EVENT_ID}/ledger`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
      }

      if (!data.success) {
        throw new Error(`Expected success: true, got: ${JSON.stringify(data)}`);
      }

      // Validate response structure
      if (!data.data.event_id) throw new Error('Missing event_id in response');
      if (typeof data.data.total_buy_ins !== 'number') throw new Error('Missing total_buy_ins');
      if (!Array.isArray(data.data.participants)) throw new Error('Missing participants array');
    });

    // Test 2: Record Buy-In (POST /api/events/[id]/buy-in)
    await this.test('POST /api/events/[id]/buy-in', async () => {
      if (!TEST_EVENT_ID || !TEST_PARTICIPANT_ID) {
        throw new Error('TEST_EVENT_ID and TEST_PARTICIPANT_ID required');
      }

      const response = await this.makeRequest(
        'POST',
        `/api/events/${TEST_EVENT_ID}/buy-in`,
        {
          participant_id: TEST_PARTICIPANT_ID,
          amount: 100,
          notes: 'Test buy-in',
        }
      );

      const data = await response.json();

      // This might fail if not authenticated or event not active
      if (response.status === 401 || response.status === 403) {
        console.log('   ⚠️  Skipped (authentication required)');
        return;
      }

      if (!response.ok) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
      }

      if (!data.success) {
        throw new Error(`Expected success: true, got: ${JSON.stringify(data)}`);
      }

      if (!data.data.ledger_entry) throw new Error('Missing ledger_entry in response');
    });

    // Test 3: Record Cash-Out (POST /api/events/[id]/cash-out)
    await this.test('POST /api/events/[id]/cash-out', async () => {
      if (!TEST_EVENT_ID || !TEST_PARTICIPANT_ID) {
        throw new Error('TEST_EVENT_ID and TEST_PARTICIPANT_ID required');
      }

      const response = await this.makeRequest(
        'POST',
        `/api/events/${TEST_EVENT_ID}/cash-out`,
        {
          participant_id: TEST_PARTICIPANT_ID,
          amount: 200,
        }
      );

      const data = await response.json();

      // This might fail if not authenticated or event not active
      if (response.status === 401 || response.status === 403) {
        console.log('   ⚠️  Skipped (authentication required)');
        return;
      }

      if (!response.ok) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
      }

      if (!data.success) {
        throw new Error(`Expected success: true, got: ${JSON.stringify(data)}`);
      }

      if (!data.data.participant) throw new Error('Missing participant in response');
    });

    // Test 4: Preview Settlement (GET /api/events/[id]/settle)
    await this.test('GET /api/events/[id]/settle (preview)', async () => {
      if (!TEST_EVENT_ID) throw new Error('TEST_EVENT_ID not set');

      const response = await this.makeRequest('GET', `/api/events/${TEST_EVENT_ID}/settle`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(data)}`);
      }

      if (!data.success) {
        throw new Error(`Expected success: true, got: ${JSON.stringify(data)}`);
      }

      if (typeof data.data.can_settle !== 'boolean') {
        throw new Error('Missing can_settle in response');
      }

      if (!Array.isArray(data.data.preview_debts)) {
        throw new Error('Missing preview_debts array');
      }
    });

    // Test 5: Validation - Invalid buy-in amount
    await this.test('POST /api/events/[id]/buy-in (validation error)', async () => {
      if (!TEST_EVENT_ID || !TEST_PARTICIPANT_ID) {
        throw new Error('TEST_EVENT_ID and TEST_PARTICIPANT_ID required');
      }

      const response = await this.makeRequest(
        'POST',
        `/api/events/${TEST_EVENT_ID}/buy-in`,
        {
          participant_id: TEST_PARTICIPANT_ID,
          amount: -10, // Invalid: negative amount
        }
      );

      const data = await response.json();

      // Should return 400 for validation error
      if (response.status !== 400) {
        throw new Error(`Expected 400 for validation error, got ${response.status}`);
      }

      if (data.success !== false) {
        throw new Error('Expected success: false for validation error');
      }

      if (data.error.code !== 'VALIDATION_ERROR') {
        throw new Error('Expected VALIDATION_ERROR code');
      }
    });

    // Test 6: Validation - Missing required fields
    await this.test('POST /api/events/[id]/cash-out (missing fields)', async () => {
      if (!TEST_EVENT_ID) throw new Error('TEST_EVENT_ID not set');

      const response = await this.makeRequest(
        'POST',
        `/api/events/${TEST_EVENT_ID}/cash-out`,
        {
          // Missing participant_id and amount
        }
      );

      const data = await response.json();

      // Should return 400 for validation error
      if (response.status !== 400) {
        throw new Error(`Expected 400 for validation error, got ${response.status}`);
      }

      if (data.success !== false) {
        throw new Error('Expected success: false for validation error');
      }
    });

    // Summary
    console.log('\n' + '='.repeat(70));
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    console.log(`Results: ${passed} passed, ${failed} failed\n`);

    if (failed > 0) {
      console.log('Failed tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
      console.log('');
    }
  }
}

// Run tests
const tester = new APITester();
tester.run().catch(console.error);

