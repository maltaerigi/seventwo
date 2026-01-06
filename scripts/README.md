# Buy-In/Cash-Out Module Test Scripts

This directory contains test scripts for the buy-in/cash-out ledger module. These tests can run independently without requiring a database connection or running server.

## Available Test Scripts

### 1. `test-ledger.ts` - Basic Logic Tests
Tests the core calculation logic with simple scenarios.

```bash
npx tsx scripts/test-ledger.ts
```

**What it tests:**
- Basic buy-in calculations
- Participant summaries
- Event summaries
- Debt calculations

### 2. `test-ledger-complex.ts` - Complex Scenario Tests
Tests with 8 participants in a realistic poker scenario.

```bash
npx tsx scripts/test-ledger-complex.ts
```

**What it tests:**
- Multiple participants with rebuys
- Winners and losers
- Settlement checks
- Debt resolution algorithm
- Edge cases (bust-out, break-even, large rebuys)

### 3. `test-api-ledger.ts` - API Module Unit Tests
Tests validation schemas, calculation functions, and response formats.

```bash
npx tsx scripts/test-api-ledger.ts
```

**What it tests:**
- Validation schemas (buy-in, cash-out, rebuy)
- Ledger calculation functions
- Cash-out validation logic
- Debt calculation
- Settlement checks
- API response format structure

### 4. `test-api-endpoints.ts` - API Endpoint Integration Tests
Tests actual HTTP endpoints (requires running server).

```bash
# First, start the dev server
npm run dev

# In another terminal, run tests
BASE_URL=http://localhost:3000 \
TEST_EVENT_ID=your-event-id \
TEST_PARTICIPANT_ID=your-participant-id \
npx tsx scripts/test-api-endpoints.ts
```

**What it tests:**
- GET `/api/events/[id]/ledger` - Get ledger summary
- POST `/api/events/[id]/buy-in` - Record buy-in
- POST `/api/events/[id]/cash-out` - Record cash-out
- GET `/api/events/[id]/settle` - Preview settlement
- Validation error handling

## Test Coverage

### ✅ Core Functionality
- [x] Buy-in calculations (initial + rebuys)
- [x] Cash-out validation
- [x] Event summary calculations
- [x] Debt resolution algorithm
- [x] Settlement checks

### ✅ Validation
- [x] Buy-in schema validation
- [x] Cash-out schema validation
- [x] Rebuy schema validation
- [x] Input validation (negative amounts, missing fields)

### ✅ Edge Cases
- [x] Bust-out ($0 cash-out)
- [x] Break-even (exact buy-in back)
- [x] Large rebuy scenarios
- [x] Multiple participants
- [x] Already cashed out validation

## Running All Tests

To run all unit tests (no server required):

```bash
npx tsx scripts/test-ledger.ts && \
npx tsx scripts/test-ledger-complex.ts && \
npx tsx scripts/test-api-ledger.ts
```

## Expected Output

All tests should show:
```
✅ All tests passed! The buy-in/cash-out logic is working correctly.
```

## Troubleshooting

### Tests fail with import errors
Make sure you're running from the project root:
```bash
cd /path/to/seventwo
npx tsx scripts/test-api-ledger.ts
```

### Integration tests fail
- Ensure the dev server is running: `npm run dev`
- Check that `TEST_EVENT_ID` and `TEST_PARTICIPANT_ID` are valid UUIDs
- Verify the event exists and is in 'active' status
- Check authentication if endpoints require it

### Type errors
Run TypeScript check:
```bash
npx tsc --noEmit
```

## Next Steps

Once all tests pass, you can:
1. Integrate the API endpoints into your frontend
2. Test with real database (run migrations first)
3. Add more test scenarios as needed

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events/[id]/ledger` | GET | Get complete ledger summary |
| `/api/events/[id]/buy-in` | POST | Record buy-in or rebuy |
| `/api/events/[id]/cash-out` | POST | Record player cash-out |
| `/api/events/[id]/settle` | GET | Preview settlement (debts) |
| `/api/events/[id]/settle` | POST | Finalize event and create debts |

