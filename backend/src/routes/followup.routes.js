const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const followupController = require('../controllers/followup.controller');

router.use(requireAuth);

router.get('/', followupController.getFollowUps);
router.post('/', followupController.createFollowUp);
router.patch('/:id/status', followupController.updateFollowUpStatus);

module.exports = router;
