import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/lender/profile
// @desc    Get current user profile
router.get('/profile', async (req, res) => {
  res.json({
    id: req.user._id,
    email: req.user.email,
    fullName: req.user.fullName,
    role: req.user.role,
    settings: {
      theme: 'dark', // Defaults that can be persisted in the future
      currency: 'COP'
    }
  });
});

// @route   PUT /api/lender/profile
// @desc    Update current user profile
router.put('/profile', async (req, res) => {
  const { fullName, email } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;

    await user.save();

    res.json({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
