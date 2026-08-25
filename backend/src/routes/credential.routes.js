const router = require('express').Router();
const ctrl = require('../controllers/credential.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(requireAuth);

router.get('/', ctrl.listCredentials);
router.post('/', requireRole('ADMIN', 'MANAGER'), ctrl.createCredential);
router.get('/:id/reveal', ctrl.revealCredential);
router.post('/:id/reveal', ctrl.revealCredential);
router.get('/:id/access-logs', ctrl.getAccessLogs);

module.exports = router;
