const { Op } = require('sequelize');
const { Loan, Borrower, PaymentSchedule, sequelize } = require('../models');
const { calculatePaymentSchedule } = require('../services/loanCalculator');
const { calculateLoanStatus } = require('../services/statusCalculator');
const { generateLoanNotifications } = require('../services/notificationService');

const getAllLoans = async (req, res) => {
  try {
    const { borrowerId, status } = req.query;

    const where = { lenderId: req.user.id };
    if (borrowerId) where.borrowerId = borrowerId;
    if (status) where.status = status;

    const loans = await Loan.findAll({
      where,
      include: [
        {
          model: Borrower,
          as: 'borrower',
          attributes: ['borrowerFirstName', 'borrowerLastName'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const loansWithCounts = await Promise.all(
      loans.map(async (loan) => {
        const totalInstallments = await PaymentSchedule.count({ where: { loanId: loan.id } });
        const paidInstallments = await PaymentSchedule.count({
          where: { loanId: loan.id, isPaid: true },
        });
        return {
          id: loan.id,
          borrowerId: loan.borrowerId,
          borrowerFirstName: loan.borrower?.borrowerFirstName,
          borrowerLastName: loan.borrower?.borrowerLastName,
          principalLoan: loan.principalLoan.toString(),
          monthlyRate: loan.monthlyRate.toString(),
          loanScheme: loan.loanScheme,
          totalMonths: loan.totalMonths,
          startDate: loan.startDate,
          maturityDate: loan.maturityDate,
          status: loan.status,
          paidInstallments,
          totalInstallments,
          createdAt: loan.createdAt,
        };
      })
    );

    res.json(loansWithCounts);
  } catch (error) {
    console.error('Error en getAllLoans:', error);
    res.status(500).json({ message: 'Error al obtener préstamos' });
  }
};

const createLoan = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { borrowerId, principalLoan, monthlyRate, loanScheme, totalMonths, startDate, maturityDate } = req.body;

    const borrower = await Borrower.findOne({
      where: { id: borrowerId, lenderId: req.user.id },
    });

    if (!borrower) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Prestatario no encontrado' });
    }

    const schedule = calculatePaymentSchedule({
      principalLoan,
      monthlyRate,
      loanScheme,
      totalMonths,
      startDate,
    });

    const loan = await Loan.create(
      {
        borrowerId,
        lenderId: req.user.id,
        principalLoan,
        monthlyRate,
        loanScheme,
        totalMonths,
        startDate,
        maturityDate,
        status: 'ACTIVE',
      },
      { transaction }
    );

    const scheduleData = schedule.map((inst) => ({
      loanId: loan.id,
      installmentNumber: inst.installmentNumber,
      dueDate: inst.dueDate,
      principalAmount: inst.principalAmount,
      interestAmount: inst.interestAmount,
      totalAmount: inst.totalAmount,
      isPaid: false,
    }));

    await PaymentSchedule.bulkCreate(scheduleData, { transaction });

    await transaction.commit();

    await generateLoanNotifications(
      loan.id,
      req.user.id,
      `${borrower.borrowerFirstName} ${borrower.borrowerLastName || ''}`.trim(),
      schedule,
      maturityDate
    );

    res.status(201).json({
      loan: {
        id: loan.id,
        borrowerId: loan.borrowerId,
        lenderId: loan.lenderId,
        principalLoan: loan.principalLoan.toString(),
        monthlyRate: loan.monthlyRate.toString(),
        loanScheme: loan.loanScheme,
        totalMonths: loan.totalMonths,
        startDate: loan.startDate,
        maturityDate: loan.maturityDate,
        status: loan.status,
        createdAt: loan.createdAt,
      },
      schedule: schedule.map((inst) => ({
        installmentNumber: inst.installmentNumber,
        dueDate: inst.dueDate,
        principalAmount: inst.principalAmount.toString(),
        interestAmount: inst.interestAmount.toString(),
        totalAmount: inst.totalAmount.toString(),
        isPaid: false,
      })),
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error en createLoan:', error);
    res.status(500).json({ message: 'Error al crear préstamo' });
  }
};

const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findOne({
      where: { id, lenderId: req.user.id },
      include: [
        {
          model: Borrower,
          as: 'borrower',
          attributes: ['borrowerFirstName', 'borrowerLastName'],
        },
        {
          model: PaymentSchedule,
          as: 'paymentSchedules',
          order: [['installmentNumber', 'ASC']],
        },
      ],
    });

    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    res.json({
      loan: {
        id: loan.id,
        borrowerId: loan.borrowerId,
        lenderId: loan.lenderId,
        principalLoan: loan.principalLoan.toString(),
        monthlyRate: loan.monthlyRate.toString(),
        loanScheme: loan.loanScheme,
        totalMonths: loan.totalMonths,
        startDate: loan.startDate,
        maturityDate: loan.maturityDate,
        status: loan.status,
        statusUpdatedAt: loan.statusUpdatedAt,
        createdAt: loan.createdAt,
      },
      borrower: {
        borrowerFirstName: loan.borrower?.borrowerFirstName,
        borrowerLastName: loan.borrower?.borrowerLastName,
      },
      schedule: loan.paymentSchedules.map((inst) => ({
        id: inst.id,
        installmentNumber: inst.installmentNumber,
        dueDate: inst.dueDate,
        principalAmount: inst.principalAmount.toString(),
        interestAmount: inst.interestAmount.toString(),
        totalAmount: inst.totalAmount.toString(),
        isPaid: inst.isPaid,
        paidAt: inst.paidAt,
      })),
    });
  } catch (error) {
    console.error('Error en getLoanById:', error);
    res.status(500).json({ message: 'Error al obtener préstamo' });
  }
};

const markInstallmentPaid = async (req, res) => {
  try {
    const { id, installmentNumber } = req.params;

    const loan = await Loan.findOne({
      where: { id, lenderId: req.user.id },
    });

    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    const installment = await PaymentSchedule.findOne({
      where: { loanId: id, installmentNumber: parseInt(installmentNumber) },
    });

    if (!installment) {
      return res.status(404).json({ message: 'Cuota no encontrada' });
    }

    if (installment.isPaid) {
      return res.status(400).json({ message: 'La cuota ya está pagada' });
    }

    await installment.update({ isPaid: true, paidAt: new Date() });

    const schedule = await PaymentSchedule.findAll({
      where: { loanId: id },
      order: [['installmentNumber', 'ASC']],
    });

    const newStatus = calculateLoanStatus(
      schedule.map((inst) => ({ isPaid: inst.isPaid, dueDate: inst.dueDate })),
      loan.status
    );

    if (newStatus !== loan.status) {
      await loan.update({ status: newStatus, statusUpdatedAt: new Date() });
    }

    res.json({
      installment: {
        id: installment.id,
        installmentNumber: installment.installmentNumber,
        dueDate: installment.dueDate,
        principalAmount: installment.principalAmount.toString(),
        interestAmount: installment.interestAmount.toString(),
        totalAmount: installment.totalAmount.toString(),
        isPaid: true,
        paidAt: installment.paidAt,
      },
      loanStatus: newStatus,
    });
  } catch (error) {
    console.error('Error en markInstallmentPaid:', error);
    res.status(500).json({ message: 'Error al marcar cuota como pagada' });
  }
};

const updateLoanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const loan = await Loan.findOne({
      where: { id, lenderId: req.user.id },
    });

    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    await loan.update({ status, statusUpdatedAt: new Date() });

    res.json({
      id: loan.id,
      status: loan.status,
      statusUpdatedAt: loan.statusUpdatedAt,
    });
  } catch (error) {
    console.error('Error en updateLoanStatus:', error);
    res.status(500).json({ message: 'Error al actualizar estado del préstamo' });
  }
};

const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findOne({
      where: { id, lenderId: req.user.id },
    });

    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    const paidInstallments = await PaymentSchedule.count({
      where: { loanId: id, isPaid: true },
    });

    if (paidInstallments > 0) {
      return res.status(409).json({ message: 'El préstamo tiene cuotas pagadas, no se puede eliminar' });
    }

    await loan.destroy();

    res.json({ message: 'Préstamo eliminado' });
  } catch (error) {
    console.error('Error en deleteLoan:', error);
    res.status(500).json({ message: 'Error al eliminar préstamo' });
  }
};

module.exports = {
  getAllLoans,
  createLoan,
  getLoanById,
  markInstallmentPaid,
  updateLoanStatus,
  deleteLoan,
};