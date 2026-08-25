const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const gstController = require('../controllers/gst.controller');

router.use(requireAuth);

router.get('/', gstController.getGstWorkspace);
router.get('/export', gstController.exportGstReturns);
router.post('/', gstController.createGstReturn);
router.post('/import', gstController.importGstReturns);
router.post('/auto-generate', gstController.autoGenerateGstReturns);
router.patch('/:id/status', gstController.updateGstReturnStatus);

module.exports = router;
