import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  capital: { type: Number, default: 0 },
  interest: { type: Number, default: 0 },
  note: String,
}, { _id: false });

const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  referenceId: String,
  color: String,
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
    type: Number,
    required: true,
  },
  interestRate: {
    type: Number,
    required: true,
  },
  scheme: String,
  schedule: mongoose.Schema.Types.Mixed,
  startDate: {
    type: Date,
    default: Date.now,
  },
  deadlineDate: {
    type: Date,
  },
  currency: {
    type: String,
    enum: ['COP', 'USD', 'EUR'],
    default: 'COP',
  },
  status: {
    type: String,
    enum: ['active', 'paid', 'overdue'],
    default: 'active',
  },
  paymentsHistory: [paymentSchema],
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    },
  },
});

const Loan = mongoose.model('Loan', loanSchema);

export default Loan;
