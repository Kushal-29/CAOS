const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');

// GET /api/dashboard — Dashboard V2 Analytics for CA Firm OS
const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalClients,
    activeClients,
    gstClientsCount,
    itrClientsCount,
    gstPendingCount,
    itrPendingCount,
    tasksPendingCount,
    overdueTasksCount,
    documentsCount,
    followUpsOpenCount,
    invoices,
    upcomingDeadlines,
    tasksByStatus,
    productivityRaw,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: 'ACTIVE' } }),
    prisma.client.count({ where: { isGstClient: true } }),
    prisma.client.count({ where: { isItrClient: true } }),
    prisma.gstReturn.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.itrReturn.count({ where: { filingStatus: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.task.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'REVIEW'] } } }),
    prisma.task.count({ where: { status: { not: 'COMPLETED' }, dueDate: { lt: now } } }),
    prisma.document.count(),
    prisma.followUp.count({ where: { status: 'OPEN' } }),
    prisma.invoice.findMany({ select: { clientFee: true, paidAmount: true, pendingAmount: true } }),
    prisma.filing.findMany({
      where: { dueDate: { gte: now, lte: in7Days }, status: { not: 'COMPLETED' } },
      orderBy: { dueDate: 'asc' },
      take: 8,
      include: { client: { select: { name: true, clientCode: true } } },
    }),
    prisma.task.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.task.groupBy({
      by: ['assigneeId'],
      where: { status: 'COMPLETED', completedAt: { gte: startOfMonth } },
      _count: { _all: true },
    }),
  ]);

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.clientFee, 0);
  const collectedRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const outstandingRevenue = invoices.reduce((sum, inv) => sum + inv.pendingAmount, 0);

  // Resolve assignee names for the productivity chart
  const assigneeIds = productivityRaw.map((p) => p.assigneeId).filter(Boolean);
  const assignees = await prisma.user.findMany({
    where: { id: { in: assigneeIds } },
    select: { id: true, name: true },
  });

  const productivity = productivityRaw
    .filter((p) => p.assigneeId)
    .map((p) => ({
      userId: p.assigneeId,
      name: assignees.find((a) => a.id === p.assigneeId)?.name || 'Staff Member',
      completedTasks: p._count._all,
    }));

  res.json({
    kpis: {
      totalClients,
      activeClients,
      gstClientsCount,
      itrClientsCount,
      gstPendingCount,
      itrPendingCount,
      tasksPendingCount,
      overdueTasksCount,
      documentsCount,
      followUpsOpenCount,
      totalRevenue,
      collectedRevenue,
      outstandingRevenue,
    },
    upcomingDeadlines,
    tasksByStatus: tasksByStatus.map((t) => ({ status: t.status, count: t._count._all })),
    productivity,
  });
});

module.exports = { getDashboard };
