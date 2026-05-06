const express = require('express');
const router = express.Router();
const {
  getAllLoans,
  createLoan,
  getLoanById,
  markInstallmentPaid,
  updateLoanStatus,
  deleteLoan,
} = require('../controllers/loanController');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { createLoanSchema, updateStatusSchema } = require('../validators/loanValidators');

router.get('/', authenticate, getAllLoans);

router.post('/', authenticate, validate(createLoanSchema), createLoan);

router.get('/:id', authenticate, getLoanById);

router.patch('/:id/installments/:installmentNumber/pay', authenticate, markInstallmentPaid);

router.patch('/:id/status', authenticate, validate(updateStatusSchema), updateLoanStatus);

router.delete('/:id', authenticate, deleteLoan);

module.exports = router;