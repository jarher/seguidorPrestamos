const express = require('express');
const router = express.Router();
const {
  getAllBorrowers,
  getBorrowerById,
  createBorrower,
  updateBorrower,
  deleteBorrower,
} = require('../controllers/borrowerController');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { createBorrowerSchema, updateBorrowerSchema } = require('../validators/borrowerValidators');

router.get('/', authenticate, getAllBorrowers);

router.get('/:id', authenticate, getBorrowerById);

router.post('/', authenticate, validate(createBorrowerSchema), createBorrower);

router.put('/:id', authenticate, validate(updateBorrowerSchema), updateBorrower);

router.delete('/:id', authenticate, deleteBorrower);

module.exports = router;