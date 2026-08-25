const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Valid mobile number required'),
  alternateMobile: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  aadhaar: z.string().optional().nullable(),
  clientType: z.enum(['INDIVIDUAL', 'PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'HUF', 'TRUST', 'OTHER']).optional(),
  entityType: z.enum(['INDIVIDUAL', 'PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'HUF', 'TRUST', 'OTHER']).optional(),
  businessType: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  tan: z.string().optional().nullable(),
  cin: z.string().optional().nullable(),
  businessAddress: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'ARCHIVED']).optional(),
  managerId: z.string().optional().nullable(),
  assignedEmployeeId: z.string().optional().nullable(),
  isGstClient: z.boolean().optional(),
  isItrClient: z.boolean().optional(),
  gstUsername: z.string().optional().nullable(),
  gstRegistrationDate: z.string().optional().nullable(),
  gstStatus: z.enum(['ACTIVE', 'CANCELLED', 'SUSPENDED']).optional(),
  gstFilingFrequency: z.enum(['MONTHLY', 'QUARTERLY']).optional(),
  itUsername: z.string().optional().nullable(),
  itrType: z.enum(['ITR1', 'ITR2', 'ITR3', 'ITR4', 'ITR5', 'ITR6', 'ITR7']).optional(),
  lastFiledAy: z.string().optional().nullable(),
  lastFiledDate: z.string().optional().nullable(),
  assessmentYear: z.string().optional().nullable(),
});

// Helper to generate sequential client code e.g. CAOS-000001
async function generateNextClientCode() {
  const count = await prisma.client.count();
  const nextNum = (count + 1).toString().padStart(6, '0');
  return `CAOS-${nextNum}`;
}

exports.listClients = async (req, res) => {
  const { search, status, clientType, isGstClient, isItrClient, page = 1, limit = 100 } = req.query;

  const take = parseInt(limit);
  const skip = (parseInt(page) - 1) * take;

  const where = {
    ...(status ? { status } : {}),
    ...(clientType ? { clientType } : {}),
    ...(isGstClient === 'true' ? { isGstClient: true } : {}),
    ...(isItrClient === 'true' ? { isItrClient: true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { clientCode: { contains: search, mode: 'insensitive' } },
            { panNumber: { contains: search, mode: 'insensitive' } },
            { gstin: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, clients] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        assignedEmployee: { select: { id: true, name: true, email: true } },
        _count: { select: { documents: true, tasks: true, gstReturns: true, itrReturns: true } },
      },
    }),
  ]);

  res.json({
    clients,
    pagination: {
      total,
      page: parseInt(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  });
};

exports.getClient = async (req, res) => {
  const { id } = req.params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      assignedEmployee: { select: { id: true, name: true, email: true } },
      documents: { orderBy: { createdAt: 'desc' }, include: { uploadedBy: { select: { name: true } } } },
      credentials: { orderBy: { createdAt: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' }, include: { author: { select: { name: true } } } },
      gstReturns: { orderBy: { dueDate: 'desc' } },
      itrReturns: { orderBy: { dueDate: 'desc' } },
      tasks: { orderBy: { createdAt: 'desc' }, include: { assignee: { select: { name: true } } } },
      followUps: { orderBy: { dueDate: 'asc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
      activityLogs: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: { select: { name: true } } } },
    },
  });

  if (!client) {
    return res.status(404).json({ message: 'Client profile not found' });
  }

  res.json({ client });
};

exports.createClient = async (req, res) => {
  const validated = clientSchema.parse(req.body);
  const clientCode = await generateNextClientCode();

  const client = await prisma.client.create({
    data: {
      ...validated,
      clientCode,
      email: validated.email || null,
      dob: validated.dob ? new Date(validated.dob) : null,
      gstRegistrationDate: validated.gstRegistrationDate ? new Date(validated.gstRegistrationDate) : null,
      lastFiledDate: validated.lastFiledDate ? new Date(validated.lastFiledDate) : null,
    },
    include: {
      manager: { select: { id: true, name: true } },
      assignedEmployee: { select: { id: true, name: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      clientId: client.id,
      entityType: 'CLIENT',
      entityId: client.id,
      action: 'CREATE',
      metadata: { name: client.name, code: client.clientCode },
    },
  });

  res.status(201).json({ client });
};

exports.updateClient = async (req, res) => {
  const { id } = req.params;
  const validated = clientSchema.partial().parse(req.body);

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...validated,
      dob: validated.dob ? new Date(validated.dob) : undefined,
      gstRegistrationDate: validated.gstRegistrationDate ? new Date(validated.gstRegistrationDate) : undefined,
      lastFiledDate: validated.lastFiledDate ? new Date(validated.lastFiledDate) : undefined,
    },
  });

  res.json({ client });
};

exports.deleteClient = async (req, res) => {
  const { id } = req.params;
  await prisma.client.delete({ where: { id } });
  res.json({ message: 'Client deleted successfully' });
};

// POST /api/clients/import — Bulk Import Clients from Excel JSON array
exports.importClients = async (req, res) => {
  const { rows } = req.body; // Array of raw Excel objects
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: 'No client rows provided for import' });
  }

  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const name = row['Client Name'] || row['Name'] || row['name'];
      const mobile = (row['Mobile'] || row['phone'] || row['mobile'] || '').toString();
      const panNumber = (row['PAN'] || row['pan'] || '').toString().trim().toUpperCase() || null;
      const gstin = (row['GSTIN'] || row['gstin'] || '').toString().trim().toUpperCase() || null;
      const email = (row['Email'] || row['email'] || '').toString().trim() || null;

      if (!name || !mobile) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Client Name and Mobile are mandatory.`);
        continue;
      }

      // Check if duplicate PAN or GSTIN exists
      if (panNumber) {
        const existingPan = await prisma.client.findFirst({ where: { panNumber } });
        if (existingPan) {
          results.failed++;
          results.errors.push(`Row ${i + 1} (${name}): PAN ${panNumber} already registered under ${existingPan.clientCode}.`);
          continue;
        }
      }

      const clientCode = await generateNextClientCode();
      const isGst = (row['GST Applicable'] || row['isGstClient'] || '').toString().toLowerCase() === 'yes' || !!gstin;
      const isItr = (row['ITR Applicable'] || row['isItrClient'] || '').toString().toLowerCase() !== 'no';

      await prisma.client.create({
        data: {
          clientCode,
          name,
          mobile,
          alternateMobile: (row['Alternate Mobile'] || '').toString() || null,
          email,
          address: row['Address'] || null,
          state: row['State'] || 'Delhi',
          businessType: row['Business Type'] || 'Trading & Services',
          panNumber,
          gstin,
          isGstClient: isGst,
          isItrClient: isItr,
          status: 'ACTIVE',
        },
      });

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  res.json({ message: `Imported ${results.success} clients successfully. ${results.failed} failed.`, results });
};

// GET /api/clients/export — Export all Clients to JSON array for Excel conversion
exports.exportClients = async (req, res) => {
  const clients = await prisma.client.findMany({
    orderBy: { clientCode: 'asc' },
    select: {
      clientCode: true,
      name: true,
      mobile: true,
      alternateMobile: true,
      email: true,
      panNumber: true,
      gstin: true,
      clientType: true,
      businessType: true,
      state: true,
      address: true,
      status: true,
      isGstClient: true,
      isItrClient: true,
      createdAt: true,
    },
  });

  res.json({ clients });
};

exports.addNote = async (req, res) => {
  const { id } = req.params;
  const { body, category } = req.body;

  const note = await prisma.note.create({
    data: {
      clientId: id,
      authorId: req.user.id,
      body,
      category: category || 'INTERNAL',
    },
    include: { author: { select: { name: true } } },
  });

  res.status(201).json({ note });
};
