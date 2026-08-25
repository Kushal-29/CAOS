const router = require('express').Router();
const { globalSearch } = require('../controllers/search.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, globalSearch);

module.exports = router;
