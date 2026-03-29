/**
 * API Integration Test - Payment Recording Flow
 * Tests against the running server (port 3001)
 * Run with: node tests/payment-api.test.mjs
 */

const BASE_URL = 'http://localhost:3001';
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// ==================== TESTS ====================

console.log('\n📋 TEST: Server Health');
try {
  const health = await api('/health');
  assertEqual(health.status, 200, 'Server is running');
  assertEqual(health.data.status, 'ok', 'Health status OK');
} catch (e) {
  console.error('  ❌ Server not reachable:', e.message);
  process.exit(1);
}

console.log('\n📋 TEST: Register & Login');

const email = `paytest_${Date.now()}@test.com`;
const reg = await api('/api/auth/register', {
  method: 'POST',
  body: { email, password: 'Test1234!', fullName: 'Payment Tester' },
});
assertEqual(reg.status, 201, 'Register returns 201');
assert(reg.data.token, 'Register returns token');
assert(reg.data.user.id, 'Register returns user with id');
assert(!reg.data.refreshToken, 'Register does NOT return refreshToken (removed)');

const token = reg.data.token;

console.log('\n📋 TEST: Create Loan');

const loanRes = await api('/api/loans', {
  method: 'POST',
  token,
  body: {
    loan: {
      borrowerName: 'Sandra',
      amount: 1000000,
      interest: 10,
      payments: 12,
      startDate: '2026-01-26',
      scheme: 'fixed',
      status: 'active',
      paymentsHistory: [],
      referenceId: 'L-TEST',
      color: '#FF6B00',
    }
  }
});
assertEqual(loanRes.status, 201, 'Loan created with 201');
const loan = loanRes.data.loan;
assert(loan.id, 'Loan has id (not _id)');
assertEqual(loan.term, 12, 'Loan term mapped from payments');
assertEqual(loan.interestRate, 10, 'Loan interestRate mapped from interest');
assertEqual(loan.borrowerName, 'Sandra', 'Loan borrowerName correct');

const loanId = loan.id;

console.log('\n📋 TEST: Record Payment (capital + interest)');

const pay1 = await api(`/api/loans/${loanId}`, {
  method: 'PUT',
  token,
  body: {
    updates: {
      $push: { paymentsHistory: { capital: 83333, interest: 100000, date: '2026-02-26' } }
    }
  }
});
assertEqual(pay1.status, 200, 'Payment recorded (200)');
const history1 = pay1.data.loan.paymentsHistory;
assertEqual(history1.length, 1, '1 payment in history');
assertEqual(history1[0].capital, 83333, 'Payment capital = 83,333');
assertEqual(history1[0].interest, 100000, 'Payment interest = 100,000');

console.log('\n📋 TEST: Record Second Payment (accumulate)');

const pay2 = await api(`/api/loans/${loanId}`, {
  method: 'PUT',
  token,
  body: {
    updates: {
      $push: { paymentsHistory: { capital: 83333, interest: 91667, date: '2026-03-26' } }
    }
  }
});
assertEqual(pay2.status, 200, 'Second payment recorded (200)');
const history2 = pay2.data.loan.paymentsHistory;
assertEqual(history2.length, 2, '2 payments in history');
assertEqual(history2[1].capital, 83333, 'Second payment capital = 83,333');
assertEqual(history2[1].interest, 91667, 'Second payment interest = 91,667');

const totalCapital = history2.reduce((a, p) => a + p.capital, 0);
const totalInterest = history2.reduce((a, p) => a + p.interest, 0);
assertEqual(totalCapital, 166666, 'Total capital = 166,666');
assertEqual(totalInterest, 191667, 'Total interest = 191,667');

console.log('\n📋 TEST: GET Loans returns payments with capital & interest');

const list = await api('/api/loans', { method: 'GET', token });
assertEqual(list.status, 200, 'GET /api/loans returns 200');
const savedLoan = list.data.loans.find(l => l.id === loanId);
assert(savedLoan, 'Loan found in list');
assertEqual(savedLoan.paymentsHistory.length, 2, '2 payments in stored loan');
assertEqual(savedLoan.paymentsHistory[0].capital, 83333, 'Stored payment has capital');
assertEqual(savedLoan.paymentsHistory[0].interest, 100000, 'Stored payment has interest');
assertEqual(savedLoan.paymentsHistory[1].capital, 83333, 'Stored payment 2 has capital');
assertEqual(savedLoan.paymentsHistory[1].interest, 91667, 'Stored payment 2 has interest');

console.log('\n📋 TEST: Delete Loan');

const del = await api(`/api/loans/${loanId}`, { method: 'DELETE', token });
assertEqual(del.status, 200, 'Loan deleted');

const listAfter = await api('/api/loans', { method: 'GET', token });
assertEqual(listAfter.data.loans.length, 0, 'No loans after delete');

// ==================== RESULTS ====================
console.log('\n' + '='.repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
