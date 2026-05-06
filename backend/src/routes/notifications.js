const express = require('express');
const router = express.Router();
const { getAllNotifications, markNotificationAsRead } = require('../controllers/notificationController');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, getAllNotifications);

router.patch('/:id/read', authenticate, markNotificationAsRead);

module.exports = router;