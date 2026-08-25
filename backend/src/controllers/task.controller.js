const asyncHandler = require('express-async-handler');
const { z } = require('zod');
const prisma = require('../config/db');
const { logActivity } = require('../utils/audit');

const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  department: z.enum(['GST', 'ITR', 'TDS', 'ROC', 'AUDIT', 'ADMIN']).optional(),
  clientId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'REVIEW', 'COMPLETED']).optional(),
  dueDate: z.string().datetime().optional(),
});

// GET /api/tasks — supports Kanban board (grouped) or flat list
const listTasks = asyncHandler(async (req, res) => {
  const { assigneeId, clientId, priority, status } = req.query;

  const where = {
    ...(req.user.role === 'EMPLOYEE' ? { assigneeId: req.user.id } : {}),
    ...(assigneeId ? { assigneeId } : {}),
    ...(clientId ? { clientId } : {}),
    ...(priority ? { priority } : {}),
    ...(status ? { status } : {}),
  };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    include: {
      client: { select: { id: true, name: true, clientCode: true } },
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { comments: true, attachments: true } },
    },
  });

  res.json({ tasks });
});

// GET /api/tasks/export — Export tasks to JSON for Excel download
const exportTasks = asyncHandler(async (req, res) => {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true, clientCode: true } },
      assignee: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });

  const exportData = tasks.map((t) => ({
    'Task Title': t.title,
    Department: t.department || 'GST',
    Client: t.client?.name || 'Internal',
    'Client Code': t.client?.clientCode || '',
    Assignee: t.assignee?.name || 'Unassigned',
    Priority: t.priority,
    Status: t.status,
    'Due Date': t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
    'Created By': t.createdBy?.name || '',
    'Created At': new Date(t.createdAt).toLocaleDateString(),
  }));

  res.json({ tasks: exportData });
});

// GET /api/tasks/:id
const getTask = asyncHandler(async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      client: true,
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      createdBy: { select: { id: true, name: true } },
      comments: { orderBy: { createdAt: 'asc' }, include: { author: { select: { name: true, avatarUrl: true } } } },
      attachments: true,
    },
  });
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json({ task });
});

// POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const data = taskSchema.parse(req.body);

  const task = await prisma.task.create({
    data: { ...data, createdById: req.user.id },
  });

  await logActivity({
    userId: req.user.id,
    clientId: task.clientId,
    entityType: 'TASK',
    entityId: task.id,
    action: 'CREATE',
  });

  res.status(201).json({ task });
});

// PUT /api/tasks/:id — general update
const updateTask = asyncHandler(async (req, res) => {
  const data = taskSchema.partial().parse(req.body);

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data,
  });

  await logActivity({
    userId: req.user.id,
    clientId: task.clientId,
    entityType: 'TASK',
    entityId: task.id,
    action: 'UPDATE',
    metadata: data,
  });

  res.json({ task });
});

// PATCH /api/tasks/:id/status — dedicated endpoint for Kanban drag-and-drop
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = z
    .object({ status: z.enum(['PENDING', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'REVIEW', 'COMPLETED']) })
    .parse(req.body);

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { status, completedAt: status === 'COMPLETED' ? new Date() : null },
  });

  await logActivity({
    userId: req.user.id,
    clientId: task.clientId,
    entityType: 'TASK',
    entityId: task.id,
    action: 'STATUS_CHANGE',
    metadata: { status },
  });

  res.json({ task });
});

// POST /api/tasks/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const { body } = z.object({ body: z.string().min(1) }).parse(req.body);

  const comment = await prisma.taskComment.create({
    data: { taskId: req.params.id, authorId: req.user.id, body },
    include: { author: { select: { name: true, avatarUrl: true } } },
  });

  res.status(201).json({ comment });
});

// DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  await prisma.task.delete({ where: { id: req.params.id } });
  await logActivity({ userId: req.user.id, entityType: 'TASK', entityId: req.params.id, action: 'DELETE' });
  res.json({ message: 'Task deleted' });
});

module.exports = { listTasks, exportTasks, getTask, createTask, updateTask, updateTaskStatus, addComment, deleteTask };
