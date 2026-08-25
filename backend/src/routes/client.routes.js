const router = require('express').Router();
const ctrl = require('../controllers/client.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(requireAuth);

router.get('/', ctrl.listClients);
router.get('/export', ctrl.exportClients);
router.post('/import', requireRole('ADMIN', 'MANAGER'), ctrl.importClients);
router.get('/:id', ctrl.getClient);
router.post('/', requireRole('ADMIN', 'MANAGER'), ctrl.createClient);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), ctrl.updateClient);
router.delete('/:id', requireRole('ADMIN'), ctrl.deleteClient);
router.post('/:id/notes', ctrl.addNote);

module.exports = router;
