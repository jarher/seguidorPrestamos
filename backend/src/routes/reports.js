const express = require('express');
const router = express.Router();
const { getPortfolioReport, getBorrowerReport } = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');

router.get('/portfolio', authenticate, getPortfolioReport);

router.get('/borrower/:id', authenticate, getBorrowerReport);

module.exports = router;