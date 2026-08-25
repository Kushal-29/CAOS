const router = require('express').Router();
const ctrl = require('../controllers/document.controller');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.use(requireAuth);

router.get('/', ctrl.listDocuments);
router.post('/upload', upload.single('file'), ctrl.uploadDocument);
router.delete('/:id', ctrl.deleteDocument);

module.exports = router;
