const { addMonths } = require('date-fns');

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

module.exports = {
  calculatePaymentSchedule,
};