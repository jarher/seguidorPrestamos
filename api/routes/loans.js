import express from 'express';
import Loan from '../models/Loan.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all loan routes
router.use(protect);

// @route   GET /api/loans
// @desc    Get all loans for current user
router.get('/', async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user._id });
    res.json({ loans });
  } catch (error) {
    console.error('Get loans error:', error.message);
    res.status(500).json({ message: 'Error al obtener préstamos' });
  }
});

// @route   POST /api/loans
// @desc    Create a new loan
router.post('/', async (req, res) => {
  const { loan: loanData } = req.body;
  console.log('POST /api/loans - userId:', req.user?._id, 'body:', JSON.stringify(loanData).substring(0, 200));
  try {
    // Map frontend fields to model fields
    const mapped = {
      userId: req.user._id,
      borrowerName: loanData.borrowerName,
      borrowerPhone: loanData.phone || loanData.borrowerPhone,
      borrowerEmail: loanData.email || loanData.borrowerEmail,
      amount: loanData.amount,
      term: loanData.term || loanData.payments,
      interestRate: loanData.interestRate || loanData.interest,
      startDate: loanData.startDate,
      deadlineDate: loanData.deadlineDate,
      status: loanData.status || 'active',
      paymentsHistory: loanData.paymentsHistory || [],
      referenceId: loanData.referenceId,
      color: loanData.color,
      scheme: loanData.scheme,
      currency: loanData.currency || 'COP',
      schedule: loanData.schedule,
    };

    console.log('Mapped loan:', JSON.stringify(mapped).substring(0, 300));
    const loan = await Loan.create(mapped);
    console.log('Loan created OK:', loan._id);
    res.status(201).json({ loan });
  } catch (error) {
    console.error('Create loan error:', error.name, '-', error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation details:', JSON.stringify(error.errors));
      const msgs = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: msgs[0] });
    }
    console.error('Full error:', error);
    res.status(400).json({ message: 'Error al crear préstamo' });
  }
});

// @route   PUT /api/loans/:id
// @desc    Update a loan (supports $push for payments)
router.put('/:id', async (req, res) => {
  const { updates } = req.body;
  try {
    // We allow MongoDB update operators for flexibility (e.g., $push)
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    res.json({ loan });
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar préstamo' });
  }
});

// @route   DELETE /api/loans/:id
// @desc    Delete a loan
router.delete('/:id', async (req, res) => {
  try {
    const loan = await Loan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    res.json({ message: 'Préstamo eliminado' });
  } catch (error) {
    console.error('Delete loan error:', error.message);
    res.status(500).json({ message: 'Error al eliminar préstamo' });
  }
});

// @route   POST /api/loans/import
// @desc    Import multiple loans (migration)
router.post('/import', async (req, res) => {
  const { loans } = req.body;
  try {
    const loansWithUser = loans.map(l => ({
      userId: req.user._id,
      referenceId: l.referenceId,
      color: l.color,
      borrowerName: l.borrowerName,
      borrowerPhone: l.phone || l.borrowerPhone,
      borrowerEmail: l.email || l.borrowerEmail,
      amount: l.amount,
      term: l.term || l.payments,
      interestRate: l.interestRate || l.interest,
      startDate: l.startDate,
      deadlineDate: l.deadlineDate,
      status: l.status || 'active',
      scheme: l.scheme,
      schedule: l.schedule,
      paymentsHistory: l.paymentsHistory || [],
      currency: l.currency || 'COP',
    }));
    const result = await Loan.insertMany(loansWithUser, { rawResult: false });
    res.status(201).json({ imported: result.length });
  } catch (error) {
    console.error('Import loans error:', error.message);
    res.status(400).json({ message: 'Error al importar préstamos' });
  }
});

export default router;
