const { isBefore, startOfDay } = require('date-fns');

const calculateLoanStatus = (schedule, currentStatus) => {
  const today = startOfDay(new Date());

  const allPaid = schedule.every((inst) => inst.isPaid);
  if (allPaid) {
    return 'PAID';
  }

  const hasOverdueUnpaid = schedule.some((inst) => {
    const dueDate = startOfDay(new Date(inst.dueDate));
    return !inst.isPaid && isBefore(dueDate, today);
  });
  if (hasOverdueUnpaid) {
    return 'DEFAULTED';
  }

  return currentStatus;
};

module.exports = {
  calculateLoanStatus,
};