const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentSchedule = sequelize.define('PaymentSchedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  loanId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'loans',
      key: 'id',
    },
  },
  installmentNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  principalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  interestAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'payment_schedules',
  timestamps: true,
});

module.exports = PaymentSchedule;