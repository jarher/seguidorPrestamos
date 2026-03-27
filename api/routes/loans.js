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
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/loans
// @desc    Create a new loan
router.post('/', async (req, res) => {
  const { loan: loanData } = req.body;
  try {
    const loan = await Loan.create({
      ...loanData,
      userId: req.user._id,
    });
    res.status(201).json({ loan });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json({ loan });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json({ message: 'Loan removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/loans/import
// @desc    Import multiple loans (migration)
router.post('/import', async (req, res) => {
  const { loans } = req.body;
  try {
    const loansWithUser = loans.map(l => ({ ...l, userId: req.user._id }));
    const result = await Loan.insertMany(loansWithUser);
    res.status(201).json({ imported: result.length });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
