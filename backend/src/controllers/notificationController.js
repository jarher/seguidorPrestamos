const { Op } = require('sequelize');
const { Notification, Loan, Borrower } = require('../models');
const { getNotifications, markAsRead } = require('../services/notificationService');

const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: {
        lenderId: req.user.id,
        scheduledFor: { [Op.lte]: new Date() },
        isRead: false,
      },
      include: [
        {
          model: Loan,
          as: 'loan',
          include: [
            {
              model: Borrower,
              as: 'borrower',
              attributes: ['borrowerFirstName', 'borrowerLastName'],
            },
          ],
        },
      ],
      order: [['scheduledFor', 'ASC']],
    });

    const formatted = notifications.map((n) => ({
      id: n.id,
      loanId: n.loanId,
      borrowerName: n.loan?.borrower
        ? `${n.loan.borrower.borrowerFirstName} ${n.loan.borrower.borrowerLastName || ''}`.trim()
        : null,
      message: n.message,
      scheduledFor: n.scheduledFor,
      isRead: n.isRead,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error en getAllNotifications:', error);
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await markAsRead(id, req.user.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    res.json({ id: notification.id, isRead: notification.isRead });
  } catch (error) {
    console.error('Error en markNotificationAsRead:', error);
    res.status(500).json({ message: 'Error al marcar notificación como leída' });
  }
};

module.exports = {
  getAllNotifications,
  markNotificationAsRead,
};