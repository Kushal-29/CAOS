const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get ITR Workspace returns list + stats
exports.getItrWorkspace = async (req, res) => {
  const { assessmentYear, status, search } = req.query;

  const where = {
    client: {
      isItrClient: true,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { panNumber: { contains: search, mode: 'insensitive' } },
          { clientCode: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    ...(assessmentYear ? { assessmentYear } : {}),
    ...(status ? { filingStatus: status } : {}),
  };

  const returns = await prisma.itrReturn.findMany({
    where,
    include: {
      client: {
        select: { id: true, name: true, clientCode: true, panNumber: true, itrType: true, manager: { select: { id: true, name: true } } },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  const totalItrClients = await prisma.client.count({ where: { isItrClient: true } });
  const pendingCount = await prisma.itrReturn.count({ where: { filingStatus: 'PENDING' } });
  const inProgressCount = await prisma.itrReturn.count({ where: { filingStatus: 'IN_PROGRESS' } });
  const filedCount = await prisma.itrReturn.count({ where: { filingStatus: 'FILED' } });
  const verifiedCount = await prisma.itrReturn.count({ where: { filingStatus: 'VERIFIED' } });
  const noticeCount = await prisma.itrReturn.count({ where: { noticeStatus: 'NOTICE_ISSUED' } });
  const refundPendingCount = await prisma.itrReturn.count({ where: { refundStatus: 'PENDING_ISSUANCE' } });

  res.json({
    kpis: {
      totalItrClients,
      pendingCount,
      inProgressCount,
      filedCount,
      verifiedCount,
      noticeCount,
      refundPendingCount,
    },
    returns,
  });
};

// Update ITR Return status
exports.updateItrReturnStatus = async (req, res) => {
  const { id } = req.params;
  const { filingStatus, refundStatus, refundAmount, noticeStatus, acknowledgementNo, filedDate, notes } = req.body;

  const itrReturn = await prisma.itrReturn.update({
    where: { id },
    data: {
      filingStatus: filingStatus || undefined,
      refundStatus: refundStatus || undefined,
      refundAmount: refundAmount !== undefined ? parseFloat(refundAmount) : undefined,
      noticeStatus: noticeStatus || undefined,
      acknowledgementNo: acknowledgementNo || undefined,
      filedDate: filedDate ? new Date(filedDate) : (filingStatus === 'FILED' ? new Date() : undefined),
      notes: notes || undefined,
    },
    include: { client: true },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      clientId: itrReturn.clientId,
      entityType: 'FILING',
      entityId: itrReturn.id,
      action: 'STATUS_CHANGE',
      metadata: { assessmentYear: itrReturn.assessmentYear, filingStatus: itrReturn.filingStatus },
    },
  });

  res.json(itrReturn);
};

// Create single ITR Return
exports.createItrReturn = async (req, res) => {
  const { clientId, assessmentYear, filingStatus, refundStatus, refundAmount, noticeStatus, acknowledgementNo, notes } = req.body;

  const itrReturn = await prisma.itrReturn.create({
    data: {
      clientId,
      assessmentYear: assessmentYear || 'AY 2025-26',
      filingStatus: filingStatus || 'PENDING',
      refundStatus: refundStatus || 'N_A',
      refundAmount: parseFloat(refundAmount || 0),
      noticeStatus: noticeStatus || 'NO_NOTICE',
      acknowledgementNo,
      dueDate: new Date('2026-07-31'),
      notes,
    },
    include: { client: true },
  });

  res.status(201).json(itrReturn);
};

// Bulk Import ITR Returns from Excel
exports.importItrReturns = async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: 'No ITR rows provided' });
  }

  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const clientCodeOrPan = row['Client Code'] || row['PAN'] || row['clientCode'] || row['pan'];
      const assessmentYear = row['Assessment Year'] || row['AY'] || row['assessmentYear'] || 'AY 2025-26';
      const filingStatus = (row['Filing Status'] || row['status'] || 'PENDING').toString().toUpperCase().replace(/ /g, '_');
      const refundStatus = (row['Refund Status'] || row['refundStatus'] || 'N_A').toString().toUpperCase().replace(/ /g, '_');
      const refundAmount = parseFloat(row['Refund Amount'] || row['refundAmount'] || 0);
      const noticeStatus = (row['Notice Status'] || row['noticeStatus'] || 'NO_NOTICE').toString().toUpperCase().replace(/ /g, '_');
      const ackNo = row['Ack Number'] || row['acknowledgementNo'] || null;
      const notes = row['Remarks'] || row['notes'] || null;

      if (!clientCodeOrPan) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Client Code or PAN required.`);
        continue;
      }

      const client = await prisma.client.findFirst({
        where: {
          OR: [
            { clientCode: { equals: clientCodeOrPan.toString().trim(), mode: 'insensitive' } },
            { panNumber: { equals: clientCodeOrPan.toString().trim(), mode: 'insensitive' } },
          ],
        },
      });

      if (!client) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: No client found with Client Code / PAN "${clientCodeOrPan}".`);
        continue;
      }

      await prisma.itrReturn.create({
        data: {
          clientId: client.id,
          assessmentYear,
          filingStatus: ['PENDING', 'DOCUMENTS_AWAITED', 'READY_FOR_FILING', 'IN_PROGRESS', 'FILED', 'VERIFIED', 'REJECTED', 'OVERDUE'].includes(filingStatus) ? filingStatus : 'PENDING',
          refundStatus: ['N_A', 'PROCESSED', 'PENDING_ISSUANCE', 'ISSUED', 'REJECTED'].includes(refundStatus) ? refundStatus : 'N_A',
          refundAmount,
          noticeStatus: ['NO_NOTICE', 'NOTICE_ISSUED', 'RESPONDED', 'RESOLVED'].includes(noticeStatus) ? noticeStatus : 'NO_NOTICE',
          acknowledgementNo: ackNo,
          dueDate: new Date('2026-07-31'),
          notes,
        },
      });

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  res.json({ message: `Imported ${results.success} ITR return records. ${results.failed} failed.`, results });
};

// Export ITR returns to JSON for Excel download
exports.exportItrReturns = async (req, res) => {
  const returns = await prisma.itrReturn.findMany({
    orderBy: { dueDate: 'desc' },
    include: {
      client: { select: { name: true, clientCode: true, panNumber: true, itrType: true } },
    },
  });

  const exportData = returns.map((r) => ({
    'Client Code': r.client?.clientCode,
    'Client Name': r.client?.name,
    PAN: r.client?.panNumber,
    'ITR Form': r.client?.itrType,
    'Assessment Year': r.assessmentYear,
    'Filing Status': r.filingStatus,
    'Refund Status': r.refundStatus,
    'Refund Amount': r.refundAmount || 0,
    'Notice Status': r.noticeStatus,
    'Ack / ITR-V Number': r.acknowledgementNo || '',
    'Filed Date': r.filedDate ? new Date(r.filedDate).toLocaleDateString() : '',
    Remarks: r.notes || '',
  }));

  res.json({ returns: exportData });
};
