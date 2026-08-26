const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get GST Workspace returns list + stats
exports.getGstWorkspace = async (req, res) => {
  const { period, status, search } = req.query;

  const where = {
    client: {
      isGstClient: true,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { gstin: { contains: search, mode: 'insensitive' } },
          { clientCode: { contains: search, mode: 'insensitive' } },
          { gstUsername: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    ...(period ? { period } : {}),
    ...(status ? { status } : {}),
  };

  const returns = await prisma.gstReturn.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          clientCode: true,
          gstin: true,
          gstUsername: true,
          gstFilingFrequency: true,
          credentials: {
            where: { type: 'GST' },
            select: { id: true, portalUsername: true },
            take: 1,
          },
          manager: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  const totalGstClients = await prisma.client.count({ where: { isGstClient: true } });
  const pendingCount = await prisma.gstReturn.count({ where: { status: 'PENDING' } });
  const inProgressCount = await prisma.gstReturn.count({ where: { status: 'IN_PROGRESS' } });
  const filedCount = await prisma.gstReturn.count({ where: { status: 'FILED' } });
  const overdueCount = await prisma.gstReturn.count({ where: { status: 'OVERDUE' } });

  res.json({
    kpis: {
      totalGstClients,
      pendingCount,
      inProgressCount,
      filedCount,
      overdueCount,
    },
    returns,
  });
};

// Update GST Return status
exports.updateGstReturnStatus = async (req, res) => {
  const { id } = req.params;
  const { status, ackNumber, filedDate, lateFee, notes } = req.body;

  const gstReturn = await prisma.gstReturn.update({
    where: { id },
    data: {
      status,
      ackNumber: ackNumber || undefined,
      filedDate: filedDate ? new Date(filedDate) : (status === 'FILED' ? new Date() : undefined),
      lateFee: lateFee !== undefined ? parseFloat(lateFee) : undefined,
      notes: notes || undefined,
    },
    include: { client: true },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      clientId: gstReturn.clientId,
      entityType: 'FILING',
      entityId: gstReturn.id,
      action: 'STATUS_CHANGE',
      metadata: { returnType: gstReturn.returnType, period: gstReturn.period, newStatus: status },
    },
  });

  res.json(gstReturn);
};

// Create new GST return record
exports.createGstReturn = async (req, res) => {
  const { clientId, period, returnType, dueDate, notes, lateFee } = req.body;

  const gstReturn = await prisma.gstReturn.create({
    data: {
      clientId,
      period: period || 'Feb 2026',
      returnType: returnType || 'GSTR1',
      dueDate: dueDate ? new Date(dueDate) : new Date(),
      lateFee: parseFloat(lateFee || 0),
      notes,
    },
    include: { client: true },
  });

  res.status(201).json(gstReturn);
};

// Bulk Import GST Returns from Excel
exports.importGstReturns = async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: 'No GST rows provided' });
  }

  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const clientCodeOrGstin = row['Client Code'] || row['GSTIN'] || row['clientCode'] || row['gstin'];
      const period = row['Period'] || row['period'] || 'Feb 2026';
      const returnType = (row['Return Type'] || row['returnType'] || 'GSTR1').toString().toUpperCase();
      const status = (row['Status'] || row['status'] || 'PENDING').toString().toUpperCase();
      const ackNumber = row['Ack Number'] || row['ARN'] || row['ackNumber'] || null;
      const lateFee = parseFloat(row['Late Fee'] || row['lateFee'] || 0);
      const notes = row['Remarks'] || row['notes'] || null;

      if (!clientCodeOrGstin) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Client Code or GSTIN required.`);
        continue;
      }

      // Lookup Client
      const client = await prisma.client.findFirst({
        where: {
          OR: [
            { clientCode: { equals: clientCodeOrGstin.toString().trim(), mode: 'insensitive' } },
            { gstin: { equals: clientCodeOrGstin.toString().trim(), mode: 'insensitive' } },
          ],
        },
      });

      if (!client) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: No client found with Client Code / GSTIN "${clientCodeOrGstin}".`);
        continue;
      }

      await prisma.gstReturn.create({
        data: {
          clientId: client.id,
          period,
          returnType: ['GSTR1', 'GSTR3B', 'CMP08', 'GSTR9'].includes(returnType) ? returnType : 'GSTR1',
          status: ['PENDING', 'IN_PROGRESS', 'FILED', 'LATE_FILED', 'OVERDUE'].includes(status) ? status : 'PENDING',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          ackNumber,
          lateFee,
          notes,
        },
      });

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  res.json({ message: `Imported ${results.success} GST return records. ${results.failed} failed.`, results });
};

// Export GST returns to JSON for Excel export
exports.exportGstReturns = async (req, res) => {
  const returns = await prisma.gstReturn.findMany({
    orderBy: { dueDate: 'desc' },
    include: {
      client: { select: { name: true, clientCode: true, gstin: true } },
    },
  });

  const exportData = returns.map((r) => ({
    'Client Code': r.client?.clientCode,
    'Client Name': r.client?.name,
    GSTIN: r.client?.gstin,
    Period: r.period,
    'Return Type': r.returnType,
    Status: r.status,
    'Due Date': r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '',
    'Filed Date': r.filedDate ? new Date(r.filedDate).toLocaleDateString() : '',
    'Ack / ARN Number': r.ackNumber || '',
    'Late Fee': r.lateFee || 0,
    Remarks: r.notes || '',
  }));

  res.json({ returns: exportData });
};

// Auto-generate monthly filing records for all active GST clients
exports.autoGenerateGstReturns = async (req, res) => {
  const { period } = req.body;
  const periodStr = period || 'Feb 2026';

  const gstClients = await prisma.client.findMany({
    where: { isGstClient: true, status: 'ACTIVE' },
  });

  let createdCount = 0;
  for (const client of gstClients) {
    const existing = await prisma.gstReturn.findFirst({
      where: { clientId: client.id, period: periodStr },
    });

    if (!existing) {
      await prisma.gstReturn.createMany({
        data: [
          {
            clientId: client.id,
            period: periodStr,
            returnType: 'GSTR1',
            status: 'PENDING',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          },
          {
            clientId: client.id,
            period: periodStr,
            returnType: 'GSTR3B',
            status: 'PENDING',
            dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          },
        ],
      });
      createdCount += 2;
    }
  }

  res.json({ message: `Auto-generated ${createdCount} GST return records for period ${periodStr}`, createdCount });
};

exports.triggerGstMonthlyReset = async (req, res) => {
  try {
    const { resetGstMonthly } = require('../services/cron.service');
    const result = await resetGstMonthly();
    res.json({ message: 'Monthly GST reset executed successfully.', result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to execute monthly GST reset', error: err.message });
  }
};
