// routes/auth.js
const express = require('express');
const router = express.Router();
const { login, logout, getMe, register, microsoftSSO } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.post('/login', login);
router.post('/microsoft', microsoftSSO);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/register', protect, requireRole('Administrator'), register);

module.exports = router;
