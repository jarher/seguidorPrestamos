const express = require('express');
const router = express.Router();
const { register, login, deleteAccount } = require('../controllers/authController');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { registerSchema, loginSchema } = require('../validators/authValidators');
const loginRateLimiter = require('../middleware/rateLimiter');

router.post('/register', validate(registerSchema), register);

router.post('/login', loginRateLimiter, validate(loginSchema), login);

router.delete('/account', authenticate, deleteAccount);

module.exports = router;