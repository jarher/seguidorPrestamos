const rateLimiter = require('express-rate-limit');

const loginRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = loginRateLimiter;