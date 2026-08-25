const router = require('express').Router();
const ctrl = require('../controllers/task.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', ctrl.listTasks);
router.get('/export', ctrl.exportTasks);
router.get('/:id', ctrl.getTask);
router.post('/', ctrl.createTask);
router.put('/:id', ctrl.updateTask);
router.patch('/:id/status', ctrl.updateTaskStatus);
router.post('/:id/comments', ctrl.addComment);
router.delete('/:id', ctrl.deleteTask);

module.exports = router;
