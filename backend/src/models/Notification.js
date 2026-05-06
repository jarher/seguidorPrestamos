const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lenderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'lender_users',
      key: 'id',
    },
  },
  loanId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'loans',
      key: 'id',
    },
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  type: {
    type: DataTypes.ENUM('UPCOMING', 'DUE_TODAY', 'NO_DUE_DATE_REMINDER'),
    allowNull: false,
  },
}, {
  tableName: 'notifications',
  timestamps: true,
});

module.exports = Notification;