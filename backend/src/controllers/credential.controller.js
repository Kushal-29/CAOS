const asyncHandler = require('express-async-handler');
const { z } = require('zod');
const prisma = require('../config/db');
const { encryptSecret, decryptSecret } = require('../utils/crypto');

const credentialSchema = z.object({
  clientId: z.string(),
  type: z.enum(['GST', 'INCOME_TAX', 'MCA', 'OTHER']),
  portalUsername: z.string().min(1),
  password: z.string().min(1), // plaintext in transit over HTTPS only; encrypted at rest immediately
});

// GET /api/credentials?clientId=  — returns metadata only, never the secret
const listCredentials = asyncHandler(async (req, res) => {
  const { clientId } = req.query;
  const credentials = await prisma.credential.findMany({
    where: clientId ? { clientId } : {},
    select: {
      id: true, clientId: true, type: true, portalUsername: true,
      lastRotatedAt: true, createdAt: true, updatedAt: true,
    },
  });
  res.json({ credentials });
});

// POST /api/credentials — Admin/Manager only (enforced at route level)
const createCredential = asyncHandler(async (req, res) => {
  const data = credentialSchema.parse(req.body);

  const credential = await prisma.credential.create({
    data: {
      clientId: data.clientId,
      type: data.type,
      portalUsername: data.portalUsername,
      encryptedSecret: encryptSecret(data.password),
      lastRotatedAt: new Date(),
    },
  });

  await prisma.credentialAccessLog.create({
    data: { credentialId: credential.id, userId: req.user.id, action: 'CREATE', ipAddress: req.ip },
  });

  res.status(201).json({
    credential: { id: credential.id, clientId: credential.clientId, type: credential.type, portalUsername: credential.portalUsername },
  });
});

// GET or POST /api/credentials/:id/reveal — always access-logged
const revealCredential = asyncHandler(async (req, res) => {
  const credential = await prisma.credential.findUnique({ where: { id: req.params.id } });
  if (!credential) {
    res.status(404);
    throw new Error('Credential not found');
  }

  await prisma.credentialAccessLog.create({
    data: { credentialId: credential.id, userId: req.user.id, action: 'REVEAL', ipAddress: req.ip },
  });

  const decrypted = decryptSecret(credential.encryptedSecret);
  res.json({ secret: decrypted, password: decrypted });
});

// GET /api/credentials/:id/access-logs
const getAccessLogs = asyncHandler(async (req, res) => {
  const logs = await prisma.credentialAccessLog.findMany({
    where: { credentialId: req.params.id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });
  res.json({ logs });
});

module.exports = { listCredentials, createCredential, revealCredential, getAccessLogs };
