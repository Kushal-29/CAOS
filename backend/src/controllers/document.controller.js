const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const { cloudinary } = require('../config/cloudinary');
const { logActivity } = require('../utils/audit');

// GET /api/documents?clientId=&category=&search=
const listDocuments = asyncHandler(async (req, res) => {
  const { clientId, category, search } = req.query;

  const documents = await prisma.document.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(category ? { category } : {}),
      ...(search ? { fileName: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true, clientCode: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
  });

  res.json({ documents });
});

// POST /api/documents/upload  (multipart/form-data, field name "file")
// Uses multer-storage-cloudinary middleware mounted in the route.
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const { clientId, taskId, category } = req.body;

  const document = await prisma.document.create({
    data: {
      clientId: clientId || null,
      taskId: taskId || null,
      uploadedById: req.user.id,
      category: category || 'OTHER',
      fileName: req.file.originalname,
      fileUrl: req.file.path, // Cloudinary secure_url
      publicId: req.file.filename, // Cloudinary public_id
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    },
  });

  await logActivity({
    userId: req.user.id,
    clientId: document.clientId,
    entityType: 'DOCUMENT',
    entityId: document.id,
    action: 'UPLOAD',
  });

  res.status(201).json({ document });
});

// DELETE /api/documents/:id
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  await cloudinary.uploader.destroy(document.publicId).catch(() => {});
  await prisma.document.delete({ where: { id: req.params.id } });

  await logActivity({
    userId: req.user.id,
    clientId: document.clientId,
    entityType: 'DOCUMENT',
    entityId: document.id,
    action: 'DELETE',
  });

  res.json({ message: 'Document deleted' });
});

module.exports = { listDocuments, uploadDocument, deleteDocument };
