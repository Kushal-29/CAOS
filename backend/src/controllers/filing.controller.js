const asyncHandler = require('express-async-handler');
const { z } = require('zod');
const prisma = require('../config/db');
const { logActivity } = require('../utils/audit');

const filingSchema = z.object({
  clientId: z.string(),
  type: z.enum(['GST', 'ITR', 'TDS', 'ROC', 'AUDIT', 'CONSULTATION']),
  period: z.string().min(1),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'REVIEW', 'COMPLETED', 'OVERDUE']).optional(),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
});

// GET /api/filings — Practice Management (Module 3) + Compliance Calendar (Module 6) feed
const listFilings = asyncHandler(async (req, res) => {
  const { clientId, type, status, from, to } = req.query;

  const filings = await prisma.filing.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? { dueDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    },
    orderBy: { dueDate: 'asc' },
    include: { client: { select: { id: true, name: true, clientCode: true } } },
  });

  res.json({ filings });
});

const createFiling = asyncHandler(async (req, res) => {
  const data = filingSchema.parse(req.body);
  const filing = await prisma.filing.create({ data });
  await logActivity({ userId: req.user.id, clientId: filing.clientId, entityType: 'FILING', entityId: filing.id, action: 'CREATE' });
  res.status(201).json({ filing });
});

const updateFiling = asyncHandler(async (req, res) => {
  const data = filingSchema.partial().parse(req.body);
  const filing = await prisma.filing.update({
    where: { id: req.params.id },
    data: { ...data, completedAt: data.status === 'COMPLETED' ? new Date() : undefined },
  });
  await logActivity({ userId: req.user.id, clientId: filing.clientId, entityType: 'FILING', entityId: filing.id, action: 'UPDATE' });
  res.json({ filing });
});

const deleteFiling = asyncHandler(async (req, res) => {
  await prisma.filing.delete({ where: { id: req.params.id } });
  res.json({ message: 'Filing deleted' });
});

module.exports = { listFilings, createFiling, updateFiling, deleteFiling };
