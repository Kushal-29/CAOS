const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const revenueController = require('../controllers/revenue.controller');

router.use(requireAuth);

router.get('/', revenueController.getRevenueData);
router.post('/', revenueController.createInvoice);
router.patch('/:id/payment', revenueController.recordPayment);

module.exports = router;
