const express = require('express');
const router = express.Router();
const { requestToken, redeemToken, getMyTokens } = require('../controllers/tokenController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my', protect, getMyTokens);
router.post('/request', protect, requestToken);
router.post('/redeem', redeemToken); // Kiosk — no auth required (token validates itself)

module.exports = router;
