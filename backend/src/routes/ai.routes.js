const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const aiController = require('../controllers/ai.controller');

router.use(requireAuth);

router.get('/notices', aiController.getNoticeAnalyses);
router.post('/notices', aiController.createNoticeAnalysis);
router.post('/chat', aiController.chatWithAssistant);

module.exports = router;
