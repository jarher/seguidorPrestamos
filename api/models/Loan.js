import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  note: String,
});

const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  borrowerName: {
    type: String,
    required: true,
    trim: true,
  },
  borrowerPhone: String,
  borrowerEmail: String,
  amount: {
    type: Number,
    required: true,
  },
  term: {
    type: Number, // in months
    required: true,
  },
  interestRate: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  deadlineDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['active', 'paid', 'overdue'],
    default: 'active',
  },
  paymentsHistory: [paymentSchema],
}, {
  timestamps: true,
});

const Loan = mongoose.model('Loan', loanSchema);

export default Loan;
