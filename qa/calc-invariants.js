function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

const calculatePaymentSchedule = ({ principalLoan, monthlyRate, loanScheme, totalMonths, startDate }) => {
  const schedule = [];
  let remainingBalance = principalLoan;
  const start = new Date(startDate);

  if (loanScheme === 'FIXED_INSTALLMENT') {
    const rate = monthlyRate;
    const factor = Math.pow(1 + rate, totalMonths);
    const monthlyPayment = principalLoan * (rate * factor) / (factor - 1);

    for (let i = 1; i <= totalMonths; i++) {
      const interestAmount = remainingBalance * rate;
      let principalAmount = monthlyPayment - interestAmount;

      if (i === totalMonths) {
        principalAmount = remainingBalance;
      }

      const totalAmount = principalAmount + interestAmount;
      remainingBalance -= principalAmount;

      schedule.push({
        installmentNumber: i,
        dueDate: addMonths(start, i).toISOString().split('T')[0],
        principalAmount: Math.round(principalAmount * 100) / 100,
        interestAmount: Math.round(interestAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
      });
    }
  } else if (loanScheme === 'DECREASING_INSTALLMENT') {
    const principalPerMonth = principalLoan / totalMonths;

    for (let i = 1; i <= totalMonths; i++) {
      const interestAmount = remainingBalance * monthlyRate;
      const totalAmount = principalPerMonth + interestAmount;
      remainingBalance -= principalPerMonth;

      schedule.push({
        installmentNumber: i,
        dueDate: addMonths(start, i).toISOString().split('T')[0],
        principalAmount: Math.round(principalPerMonth * 100) / 100,
        interestAmount: Math.round(interestAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
      });
    }
  } else if (loanScheme === 'NO_INTEREST') {
    const principalPerMonth = principalLoan / totalMonths;

    for (let i = 1; i <= totalMonths; i++) {
      schedule.push({
        installmentNumber: i,
        dueDate: addMonths(start, i).toISOString().split('T')[0],
        principalAmount: Math.round(principalPerMonth * 100) / 100,
        interestAmount: 0,
        totalAmount: Math.round(principalPerMonth * 100) / 100,
      });
    }
  }

  const totalPrincipal = schedule.reduce((sum, inst) => sum + inst.principalAmount, 0);
  const diff = Math.round((principalLoan - totalPrincipal) * 100) / 100;
  if (Math.abs(diff) >= 0.01 && schedule.length > 0) {
    schedule[schedule.length - 1].principalAmount = Math.round((schedule[schedule.length - 1].principalAmount + diff) * 100) / 100;
    schedule[schedule.length - 1].totalAmount = schedule[schedule.length - 1].principalAmount;
  }

  return schedule;
};

function verifyInvariants(params, testName) {
  console.log(`\n=== ${testName} ===`);
  console.log('Input:', JSON.stringify(params, null, 2));

  const schedule = calculatePaymentSchedule(params);
  const start = new Date(params.startDate);

  let allPassed = true;

  const sumPrincipal = schedule.reduce((sum, inst) => sum + inst.principalAmount, 0);
  const principalInvariant = Math.abs(sumPrincipal - params.principalLoan) < 0.01;
  console.log(`\n1. Invariante principal: sum(principalAmount) = ${sumPrincipal.toFixed(2)} === principalLoan = ${params.principalLoan} => ${principalInvariant ? 'PASS' : 'FAIL'}`);
  if (!principalInvariant) allPassed = false;

  if (params.loanScheme === 'NO_INTEREST') {
    const sumInterest = schedule.reduce((sum, inst) => sum + inst.interestAmount, 0);
    const interestInvariant = sumInterest === 0;
    console.log(`2. Invariante interés: sum(interestAmount) = ${sumInterest} === 0 => ${interestInvariant ? 'PASS' : 'FAIL'}`);
    if (!interestInvariant) allPassed = false;
  }

  let datesCorrect = true;
  for (let i = 0; i < schedule.length; i++) {
    const expectedDate = addMonths(start, i + 1).toISOString().split('T')[0];
    if (schedule[i].dueDate !== expectedDate) {
      datesCorrect = false;
      console.log(`   FAIL: Cuota ${i + 1}: esperado ${expectedDate}, obtenido ${schedule[i].dueDate}`);
    }
  }
  console.log(`3. Invariante fechas: cada dueDate = startDate + N meses => ${datesCorrect ? 'PASS' : 'FAIL'}`);
  if (!datesCorrect) allPassed = false;

  console.log('\nSchedule generado:');
  schedule.forEach(inst => {
    console.log(`  Cuota ${inst.installmentNumber}: ${inst.dueDate} | Principal: ${inst.principalAmount} | Interés: ${inst.interestAmount} | Total: ${inst.totalAmount}`);
  });

  return allPassed;
}

console.log('=== VERIFICACIÓN DE INVARIANTES MATEMÁTICOS ===');

const tests = [
  {
    name: 'FIXED_INSTALLMENT - $1,000,000, 2% mensual, 3 meses',
    params: { principalLoan: 1000000, monthlyRate: 0.02, loanScheme: 'FIXED_INSTALLMENT', totalMonths: 3, startDate: '2026-01-01' }
  },
  {
    name: 'FIXED_INSTALLMENT - $500,000, 1.5% mensual, 6 meses',
    params: { principalLoan: 500000, monthlyRate: 0.015, loanScheme: 'FIXED_INSTALLMENT', totalMonths: 6, startDate: '2026-02-15' }
  },
  {
    name: 'DECREASING_INSTALLMENT - $1,000,000, 2% mensual, 3 meses',
    params: { principalLoan: 1000000, monthlyRate: 0.02, loanScheme: 'DECREASING_INSTALLMENT', totalMonths: 3, startDate: '2026-01-01' }
  },
  {
    name: 'DECREASING_INSTALLMENT - $750,000, 1% mensual, 12 meses',
    params: { principalLoan: 750000, monthlyRate: 0.01, loanScheme: 'DECREASING_INSTALLMENT', totalMonths: 12, startDate: '2026-03-01' }
  },
  {
    name: 'NO_INTEREST - $1,000,000, 3 meses',
    params: { principalLoan: 1000000, monthlyRate: 0, loanScheme: 'NO_INTEREST', totalMonths: 3, startDate: '2026-01-01' }
  },
  {
    name: 'NO_INTEREST - $300,000, 6 meses',
    params: { principalLoan: 300000, monthlyRate: 0, loanScheme: 'NO_INTEREST', totalMonths: 6, startDate: '2026-04-01' }
  },
];

let totalPassed = 0;
tests.forEach(test => {
  if (verifyInvariants(test.params, test.name)) {
    totalPassed++;
  }
});

console.log('\n=== RESUMEN ===');
console.log(`Tests pasados: ${totalPassed}/${tests.length}`);
console.log(totalPassed === tests.length ? '✓ TODOS LOS INVARIANTES VERIFICADOS' : '✗ ALGUNOS INVARIANTES FALLARON');