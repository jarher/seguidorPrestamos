const { addDays, addMonths } = require('date-fns');
const { Notification } = require('../models');

const generateLoanNotifications = async (loanId, lenderId, borrowerName, schedule, maturityDate) => {
  const notifications = [];

  for (const installment of schedule) {
    const upcomingDate = addDays(new Date(installment.dueDate), -2);
    const dueTodayDate = new Date(installment.dueDate);

    notifications.push({
      lenderId,
      loanId,
      message: `[COBRO PRÓXIMO] ${borrowerName} debe $${installment.totalAmount.toLocaleString('es-CO')} el ${installment.dueDate}`,
      scheduledFor: upcomingDate,
      isRead: false,
      type: 'UPCOMING',
    });

    notifications.push({
      lenderId,
      loanId,
      message: `[COBRO HOY] ${borrowerName} debe $${installment.totalAmount.toLocaleString('es-CO')} ($${installment.principalAmount.toLocaleString('es-CO')} capital + $${installment.interestAmount.toLocaleString('es-CO')} interés)`,
      scheduledFor: dueTodayDate,
      isRead: false,
      type: 'DUE_TODAY',
    });
  }

  if (!maturityDate && schedule.length > 0) {
    const startDate = new Date(schedule[0].dueDate);
    startDate.setMonth(startDate.getMonth() - 1);
    const reminderDate = addMonths(startDate, 1);

    notifications.push({
      lenderId,
      loanId,
      message: `[SIN FECHA LÍMITE] Préstamo a ${borrowerName} sin fecha de vencimiento definida`,
      scheduledFor: reminderDate,
      isRead: false,
      type: 'NO_DUE_DATE_REMINDER',
    });
  }

  await Notification.bulkCreate(notifications);
};

const getNotifications = async (lenderId) => {
  return Notification.findAll({
    where: {
      lenderId,
      scheduledFor: { [require('sequelize').Op.lte]: new Date() },
      isRead: false,
    },
    order: [['scheduledFor', 'ASC']],
  });
};

const markAsRead = async (notificationId, lenderId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, lenderId },
  });

  if (!notification) {
    return null;
  }

  await notification.update({ isRead: true });
  return notification;
};

module.exports = {
  generateLoanNotifications,
  getNotifications,
  markAsRead,
};