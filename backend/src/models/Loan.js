const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  borrowerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'borrowers',
      key: 'id',
    },
  },
  lenderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'lender_users',
      key: 'id',
    },
  },
  principalLoan: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  monthlyRate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  loanScheme: {
    type: DataTypes.ENUM('FIXED_INSTALLMENT', 'DECREASING_INSTALLMENT', 'NO_INTEREST'),
    allowNull: false,
  },
  totalMonths: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  maturityDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'DEFAULTED', 'PAID'),
    allowNull: false,
    defaultValue: 'ACTIVE',
  },
  statusUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'loans',
  timestamps: true,
  paranoid: true,
});

module.exports = Loan;