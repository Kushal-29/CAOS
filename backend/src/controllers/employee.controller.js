const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Get list of employees with assigned client & task counts
exports.getEmployees = async (req, res) => {
  const employees = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatarUrl: true,
      joiningDate: true,
      performanceScore: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          assignedEmployeeClients: true,
          assignedTasks: true,
        },
      },
    },
  });

  const formatted = await Promise.all(
    employees.map(async (e) => {
      const pendingTasksCount = await prisma.task.count({
        where: { assigneeId: e.id, status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'REVIEW'] } },
      });
      const completedTasksCount = await prisma.task.count({
        where: { assigneeId: e.id, status: 'COMPLETED' },
      });

      return {
        ...e,
        assignedClientsCount: e._count.assignedEmployeeClients,
        totalTasksCount: e._count.assignedTasks,
        pendingTasksCount,
        completedTasksCount,
      };
    })
  );

  res.json(formatted);
};

// Create new Staff User (Phase 11 User Management)
exports.createEmployee = async (req, res) => {
  const { name, email, role, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ message: 'Email address already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const employee = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role) ? role : 'EMPLOYEE',
      phone: phone || null,
      isActive: true,
      joiningDate: new Date(),
      performanceScore: 100.0,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      joiningDate: true,
    },
  });

  res.status(201).json(employee);
};

// Toggle Employee Active/Deactive Status
exports.toggleActiveStatus = async (req, res) => {
  const { id } = req.params;

  const emp = await prisma.user.findUnique({ where: { id } });
  if (!emp) return res.status(404).json({ message: 'User not found' });

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !emp.isActive },
    select: { id: true, name: true, email: true, isActive: true },
  });

  res.json({ message: `User status changed to ${updated.isActive ? 'Active' : 'Inactive'}`, user: updated });
};

// Reset Staff Password
exports.resetPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  res.json({ message: 'Staff user password reset successfully' });
};

// Get single employee details with assigned clients & tasks
exports.getEmployeeById = async (req, res) => {
  const { id } = req.params;

  const employee = await prisma.user.findUnique({
    where: { id },
    include: {
      assignedEmployeeClients: {
        select: { id: true, name: true, clientCode: true, panNumber: true, gstin: true },
      },
      assignedTasks: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true, clientCode: true } },
        },
      },
    },
  });

  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  res.json(employee);
};
