const { Loan, PaymentSchedule, Borrower } = require('../models');

const getPortfolioReport = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    const loans = await Loan.findAll({
      where: { lenderId: req.user.id },
      include: [
        {
          model: Borrower,
          as: 'borrower',
          attributes: ['borrowerFirstName', 'borrowerLastName'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const data = await Promise.all(
      loans.map(async (loan) => {
        const installments = await PaymentSchedule.findAll({
          where: { loanId: loan.id },
        });
        const totalPaid = installments
          .filter((i) => i.isPaid)
          .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0);
        const remaining = parseFloat(loan.principalLoan) - totalPaid;

        return {
          BorrowerName: `${loan.borrower?.borrowerFirstName || ''} ${loan.borrower?.borrowerLastName || ''}`.trim(),
          LoanId: loan.id,
          Principal: loan.principalLoan,
          Scheme: loan.loanScheme,
          MonthlyRate: loan.monthlyRate,
          TotalMonths: loan.totalMonths,
          StartDate: loan.startDate,
          Status: loan.status,
          PaidInstallments: installments.filter((i) => i.isPaid).length,
          TotalInstallments: installments.length,
          TotalPaid: totalPaid.toFixed(2),
          Remaining: remaining.toFixed(2),
        };
      })
    );

    if (format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Portfolio');

      worksheet.columns = [
        { header: 'BorrowerName', key: 'BorrowerName', width: 25 },
        { header: 'LoanId', key: 'LoanId', width: 20 },
        { header: 'Principal', key: 'Principal', width: 15 },
        { header: 'Scheme', key: 'Scheme', width: 20 },
        { header: 'MonthlyRate', key: 'MonthlyRate', width: 12 },
        { header: 'TotalMonths', key: 'TotalMonths', width: 12 },
        { header: 'StartDate', key: 'StartDate', width: 12 },
        { header: 'Status', key: 'Status', width: 12 },
        { header: 'PaidInstallments', key: 'PaidInstallments', width: 15 },
        { header: 'TotalInstallments', key: 'TotalInstallments', width: 17 },
        { header: 'TotalPaid', key: 'TotalPaid', width: 12 },
        { header: 'Remaining', key: 'Remaining', width: 12 },
      ];

      data.forEach((row) => worksheet.addRow(row));

      res.setHeader('Content-Disposition', 'attachment; filename="portfolio.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      await workbook.xlsx.write(res);
      res.end();
    } else {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map((row) => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Disposition', 'attachment; filename="portfolio.csv"');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    }
  } catch (error) {
    console.error('Error en getPortfolioReport:', error);
    res.status(500).json({ message: 'Error al generar reporte de cartera' });
  }
};

const getBorrowerReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'csv' } = req.query;

    const borrower = await Borrower.findOne({
      where: { id, lenderId: req.user.id },
    });

    if (!borrower) {
      return res.status(404).json({ message: 'Prestatario no encontrado' });
    }

    const loans = await Loan.findAll({
      where: { borrowerId: id },
      include: [
        {
          model: PaymentSchedule,
          as: 'paymentSchedules',
          order: [['installmentNumber', 'ASC']],
        },
      ],
    });

    const data = [];
    for (const loan of loans) {
      for (const inst of loan.paymentSchedules || []) {
        data.push({
          LoanId: loan.id,
          Principal: loan.principalLoan,
          Scheme: loan.loanScheme,
          MonthlyRate: loan.monthlyRate,
          InstallmentNumber: inst.installmentNumber,
          DueDate: inst.dueDate,
          Principal: inst.principalAmount,
          Interest: inst.interestAmount,
          Total: inst.totalAmount,
          IsPaid: inst.isPaid ? 'Yes' : 'No',
          PaidAt: inst.paidAt || '',
        });
      }
    }

    if (format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Borrower Report');

      worksheet.columns = [
        { header: 'LoanId', key: 'LoanId', width: 20 },
        { header: 'Principal', key: 'Principal', width: 15 },
        { header: 'Scheme', key: 'Scheme', width: 20 },
        { header: 'MonthlyRate', key: 'MonthlyRate', width: 12 },
        { header: 'InstallmentNumber', key: 'InstallmentNumber', width: 17 },
        { header: 'DueDate', key: 'DueDate', width: 12 },
        { header: 'Principal', key: 'Principal', width: 12 },
        { header: 'Interest', key: 'Interest', width: 10 },
        { header: 'Total', key: 'Total', width: 12 },
        { header: 'IsPaid', key: 'IsPaid', width: 8 },
        { header: 'PaidAt', key: 'PaidAt', width: 20 },
      ];

      data.forEach((row) => worksheet.addRow(row));

      res.setHeader('Content-Disposition', 'attachment; filename="borrower-report.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      await workbook.xlsx.write(res);
      res.end();
    } else {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map((row) => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Disposition', 'attachment; filename="borrower-report.csv"');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    }
  } catch (error) {
    console.error('Error en getBorrowerReport:', error);
    res.status(500).json({ message: 'Error al generar reporte de prestatario' });
  }
};

module.exports = {
  getPortfolioReport,
  getBorrowerReport,
};