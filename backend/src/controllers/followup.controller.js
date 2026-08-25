const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get follow-up items list
exports.getFollowUps = async (req, res) => {
  const { category, status, clientId } = req.query;

  const where = {
    ...(category ? { category } : {}),
    ...(status ? { status } : {}),
    ...(clientId ? { clientId } : {}),
  };

  const followUps = await prisma.followUp.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, clientCode: true, mobile: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  const openCount = await prisma.followUp.count({ where: { status: 'OPEN' } });
  const resolvedCount = await prisma.followUp.count({ where: { status: 'RESOLVED' } });

  res.json({
    kpis: { openCount, resolvedCount },
    followUps,
  });
};

// Create follow-up item
exports.createFollowUp = async (req, res) => {
  const { clientId, category, title, notes, dueDate, assignedToId } = req.body;

  const followUp = await prisma.followUp.create({
    data: {
      clientId,
      category: category || 'DOCUMENTS',
      title,
      notes,
      dueDate: new Date(dueDate),
      assignedToId: assignedToId || req.user.id,
    },
    include: { client: true, assignedTo: true },
  });

  res.status(201).json(followUp);
};

// Update follow-up status (OPEN / RESOLVED / CANCELLED)
exports.updateFollowUpStatus = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const followUp = await prisma.followUp.update({
    where: { id },
    data: {
      status,
      ...(notes ? { notes } : {}),
    },
    include: { client: true },
  });

  res.json(followUp);
};
