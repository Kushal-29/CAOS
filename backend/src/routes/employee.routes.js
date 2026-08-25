const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const employeeController = require('../controllers/employee.controller');

router.use(requireAuth);

router.get('/', employeeController.getEmployees);
router.post('/', requireRole('ADMIN', 'MANAGER'), employeeController.createEmployee);
router.patch('/:id/toggle-active', requireRole('ADMIN'), employeeController.toggleActiveStatus);
router.patch('/:id/reset-password', requireRole('ADMIN', 'MANAGER'), employeeController.resetPassword);
router.get('/:id', employeeController.getEmployeeById);

module.exports = router;
