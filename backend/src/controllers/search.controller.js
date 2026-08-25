const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');

// GET /api/search?q=  — Global Search Engine
const globalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ clients: [], tasks: [], invoices: [] });

  const [clients, tasks, invoices] = await Promise.all([
    prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { panNumber: { contains: q, mode: 'insensitive' } },
          { gstin: { contains: q, mode: 'insensitive' } },
          { mobile: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
          { clientCode: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: { id: true, name: true, clientCode: true, panNumber: true, gstin: true, mobile: true, email: true },
    }),
    prisma.task.findMany({
      where: { title: { contains: q, mode: 'insensitive' } },
      take: 10,
      select: { id: true, title: true, status: true, priority: true, dueDate: true },
    }),
    prisma.invoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: q, mode: 'insensitive' } },
          { client: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: 10,
      include: { client: { select: { name: true, clientCode: true } } },
    }),
  ]);

  res.json({ clients, tasks, invoices });
});

module.exports = { globalSearch };
