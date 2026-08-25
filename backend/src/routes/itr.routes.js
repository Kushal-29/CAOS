const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const itrController = require('../controllers/itr.controller');

router.use(requireAuth);

router.get('/', itrController.getItrWorkspace);
router.get('/export', itrController.exportItrReturns);
router.post('/', itrController.createItrReturn);
router.post('/import', itrController.importItrReturns);
router.patch('/:id/status', itrController.updateItrReturnStatus);

module.exports = router;
