const router = require('express').Router();
const ctrl = require('../controllers/filing.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(requireAuth);

router.get('/', ctrl.listFilings);
router.post('/', requireRole('ADMIN', 'MANAGER'), ctrl.createFiling);
router.put('/:id', ctrl.updateFiling);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), ctrl.deleteFiling);

module.exports = router;
