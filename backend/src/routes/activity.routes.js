const router = require('express').Router();
const { listActivity } = require('../controllers/activity.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, listActivity);

module.exports = router;
