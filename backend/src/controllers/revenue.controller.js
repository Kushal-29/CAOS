const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get Revenue Dashboard & Invoice List
exports.getRevenueData = async (req, res) => {
  const { status, serviceType, clientId, search } = req.query;

  const where = {
    ...(status ? { status } : {}),
    ...(serviceType ? { serviceType } : {}),
    ...(clientId ? { clientId } : {}),
    ...(search ? {
      OR: [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { client: { clientCode: { contains: search, mode: 'insensitive' } } },
      ],
    } : {}),
  };

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, clientCode: true, mobile: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const allInvoices = await prisma.invoice.findMany({
    select: { clientFee: true, paidAmount: true, pendingAmount: true, status: true },
  });

  const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.clientFee, 0);
  const collectedRevenue = allInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const outstandingRevenue = allInvoices.reduce((sum, inv) => sum + inv.pendingAmount, 0);

  res.json({
    kpis: {
      totalRevenue,
      collectedRevenue,
      outstandingRevenue,
      totalInvoicesCount: allInvoices.length,
    },
    invoices,
  });
};

// Create new invoice
exports.createInvoice = async (req, res) => {
  const { clientId, serviceType, clientFee, paidAmount, dueDate, notes } = req.body;

  const count = await prisma.invoice.count();
  const invoiceNumber = `INV-2026-${String(count + 1).padStart(4, '0')}`;

  const fee = parseFloat(clientFee);
  const paid = parseFloat(paidAmount || 0);
  const pending = fee - paid;
  let status = 'UNPAID';
  if (paid >= fee) status = 'PAID';
  else if (paid > 0) status = 'PARTIALLY_PAID';

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      clientId,
      serviceType: serviceType || 'ITR_FILING',
      clientFee: fee,
      paidAmount: paid,
      pendingAmount: pending,
      status,
      dueDate: new Date(dueDate),
      notes,
    },
    include: { client: true },
  });

  res.status(201).json(invoice);
};

// Record payment / update invoice status
exports.recordPayment = async (req, res) => {
  const { id } = req.params;
  const { additionalPayment } = req.body;

  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Invoice not found' });

  const newPaid = existing.paidAmount + parseFloat(additionalPayment);
  const newPending = Math.max(0, existing.clientFee - newPaid);
  let newStatus = existing.status;
  if (newPending === 0) newStatus = 'PAID';
  else if (newPaid > 0) newStatus = 'PARTIALLY_PAID';

  const updatedInvoice = await prisma.invoice.update({
    where: { id },
    data: {
      paidAmount: newPaid,
      pendingAmount: newPending,
      status: newStatus,
    },
    include: { client: true },
  });

  res.json(updatedInvoice);
};
