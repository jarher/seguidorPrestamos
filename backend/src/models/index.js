const sequelize = require('../config/database');
const LenderUser = require('./LenderUser');
const Borrower = require('./Borrower');
const Loan = require('./Loan');
const PaymentSchedule = require('./PaymentSchedule');
const Notification = require('./Notification');

LenderUser.hasMany(Borrower, { foreignKey: 'lenderId' });
Borrower.belongsTo(LenderUser, { foreignKey: 'lenderId' });

Borrower.hasMany(Loan, { foreignKey: 'borrowerId' });
Loan.belongsTo(Borrower, { foreignKey: 'borrowerId' });

Loan.hasMany(PaymentSchedule, { foreignKey: 'loanId' });
PaymentSchedule.belongsTo(Loan, { foreignKey: 'loanId' });

LenderUser.hasMany(Notification, { foreignKey: 'lenderId' });
Notification.belongsTo(LenderUser, { foreignKey: 'lenderId' });

Loan.hasMany(Notification, { foreignKey: 'loanId' });
Notification.belongsTo(Loan, { foreignKey: 'loanId' });

module.exports = {
  sequelize,
  LenderUser,
  Borrower,
  Loan,
  PaymentSchedule,
  Notification,
};