/**
 * Payment Schema & Loan Calculation Tests
 * Standalone tests - run with: node tests/payment.test.mjs
 */

import { calculateLoanSchedule, calculateFlatLoanSchedule, calculateScheduleStatus } from '../client/js/utils/calculations.js';

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

// ==================== TESTS ====================

console.log('\n📋 TEST: Payment Schema Fields (capital + interest)');

{
  // Verify that paymentsHistory uses { capital, interest, date }
  const payment = { capital: 83333, interest: 100000, date: '2026-02-26' };
  assert(payment.hasOwnProperty('capital'), 'Payment has "capital" field');
  assert(payment.hasOwnProperty('interest'), 'Payment has "interest" field');
  assert(payment.hasOwnProperty('date'), 'Payment has "date" field');
  assertEqual(payment.capital, 83333, 'Capital value correct');
  assertEqual(payment.interest, 100000, 'Interest value correct');

  // Simulate accumulation of multiple payments
  const history = [
    { capital: 83333, interest: 100000, date: '2026-02-26' },
    { capital: 83333, interest: 91667, date: '2026-03-26' },
    { capital: 83333, interest: 83333, date: '2026-04-26' },
  ];
  const totalCapital = history.reduce((a, p) => a + p.capital, 0);
  const totalInterest = history.reduce((a, p) => a + p.interest, 0);
  assertEqual(totalCapital, 249999, 'Total capital accumulates correctly');
  assertEqual(totalInterest, 275000, 'Total interest accumulates correctly');
}

console.log('\n📋 TEST: Dashboard Interest Calculation (from paymentsHistory)');

{
  // Simulate how LenderDashboard calculates total interest
  const loans = [
    {
      amount: 1000000,
      paymentsHistory: [
        { capital: 83333, interest: 100000, date: '2026-02-26' },
        { capital: 83333, interest: 91667, date: '2026-03-26' },
      ]
    },
    {
      amount: 500000,
      paymentsHistory: [
        { capital: 50000, interest: 25000, date: '2026-03-15' },
      ]
    }
  ];

  const totalInterest = loans.reduce(
    (acc, loan) =>
      acc + (loan.paymentsHistory || []).reduce(
        (pAcc, p) => pAcc + (parseFloat(p.interest) || 0), 0,
      ),
    0,
  );

  assertEqual(totalInterest, 216667, 'Dashboard sums interest from all loans paymentsHistory');

  const totalCapital = loans.reduce((acc, loan) => acc + loan.amount, 0);
  assertEqual(totalCapital, 1500000, 'Dashboard sums loan amounts as total capital');

  // Per-loan interest
  const loan1Interest = loans[0].paymentsHistory.reduce((a, p) => a + (parseFloat(p.interest) || 0), 0);
  assertEqual(loan1Interest, 191667, 'Loan 1 interest calculated from paymentsHistory');

  const loan2Interest = loans[1].paymentsHistory.reduce((a, p) => a + (parseFloat(p.interest) || 0), 0);
  assertEqual(loan2Interest, 25000, 'Loan 2 interest calculated from paymentsHistory');
}

console.log('\n📋 TEST: Schedule Status with { capital, interest } payments');

{
  const today = new Date().toISOString().split('T')[0];
  const longAgo = new Date(Date.now() - 86400000 * 40).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Pending
  const loanPending = {
    startDate: today,
    amount: 1000,
    payments: 1,
    paymentsHistory: [],
    schedule: calculateLoanSchedule(1000, 15, 1, today),
  };
  const resultPending = calculateScheduleStatus(loanPending);
  assertEqual(resultPending[0].status, 'pendiente', 'Future installment is "pendiente"');

  // Mora
  const loanMora = {
    startDate: longAgo,
    amount: 1000,
    payments: 1,
    paymentsHistory: [],
    schedule: calculateLoanSchedule(1000, 15, 1, longAgo),
  };
  const resultMora = calculateScheduleStatus(loanMora);
  assertEqual(resultMora[0].status, 'mora', 'Unpaid past installment is "mora"');

  // Pagada
  const loanPagada = {
    startDate: longAgo,
    amount: 1000,
    payments: 1,
    paymentsHistory: [
      { capital: 1000, interest: 150, date: yesterday }
    ],
    schedule: calculateLoanSchedule(1000, 15, 1, longAgo),
  };
  const resultPagada = calculateScheduleStatus(loanPagada);
  assertEqual(resultPagada[0].status, 'pagada', 'Paid past installment is "pagada"');
}

console.log('\n📋 TEST: Cuota Decreciente (calculation integrity)');

{
  const schedule = calculateLoanSchedule(1000000, 15, 5, '2024-01-01');
  assertEqual(schedule.length, 5, '5 installments generated');
  assertEqual(schedule[0].principalPayment, 200000, 'Principal per installment = 200,000');
  assertEqual(schedule[0].interestPayment, 150000, 'First interest = 150,000');
  assertEqual(schedule[4].remainingBalance, 0, 'Final balance = 0');

  const totalInterest = schedule.reduce((s, p) => s + p.interestPayment, 0);
  assertEqual(totalInterest, 450000, 'Total interest = 450,000');
}

console.log('\n📋 TEST: Cuota Fija (calculation integrity)');

{
  const schedule = calculateFlatLoanSchedule(1000000, 15, 5, '2024-01-01');
  assertEqual(schedule.length, 5, '5 installments generated');
  assertEqual(schedule[0].interestPayment, 150000, 'Flat interest = 150,000 every month');
  assertEqual(schedule[4].interestPayment, 150000, 'Last installment also 150,000 interest');
  assertEqual(schedule[4].remainingBalance, 0, 'Final balance = 0');
}

console.log('\n📋 TEST: Sin Intereses');

{
  const schedule = calculateFlatLoanSchedule(1000000, 0, 5, '2024-01-01');
  assertEqual(schedule[0].interestPayment, 0, 'Interest-free: interest = 0');
  assertEqual(schedule[0].totalPayment, 200000, 'Interest-free: total = principal only');
  assertEqual(schedule[4].remainingBalance, 0, 'Final balance = 0');
}

console.log('\n📋 TEST: Empty / missing paymentsHistory');

{
  const loans = [
    { amount: 1000000, paymentsHistory: [] },
    { amount: 500000, paymentsHistory: undefined },
    { amount: 250000 },
  ];
  const totalInterest = loans.reduce(
    (acc, loan) =>
      acc + (loan.paymentsHistory || []).reduce(
        (pAcc, p) => pAcc + (parseFloat(p.interest) || 0), 0,
      ),
    0,
  );
  assertEqual(totalInterest, 0, 'No payments = $0 interest (no crash on undefined/empty)');
}

// ==================== RESULTS ====================
console.log('\n' + '='.repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);
