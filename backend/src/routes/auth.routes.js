const router = require('express').Router();
const { register, login, refresh, logout, me } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.post('/register', requireAuth, requireRole('ADMIN'), register);

module.exports = router;
