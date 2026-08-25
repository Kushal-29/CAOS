const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');

// GET /api/activity?clientId=  — Activity Timeline (Module 9)
const listActivity = asyncHandler(async (req, res) => {
  const { clientId, entityType, take = '50' } = req.query;

  const logs = await prisma.activityLog.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(entityType ? { entityType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(parseInt(take, 10) || 50, 200),
    include: { user: { select: { name: true, avatarUrl: true } } },
  });

  res.json({ logs });
});

module.exports = { listActivity };
