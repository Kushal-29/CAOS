const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get ITR Workspace returns list + stats
exports.getItrWorkspace = async (req, res) => {
  try {
    const { status, search, assignedTo } = req.query;

    const where = {
      ...(search ? {
        OR: [
          { client: { name: { contains: search, mode: 'insensitive' } } },
          { client: { panNumber: { contains: search, mode: 'insensitive' } } },
          { client: { clientCode: { contains: search, mode: 'insensitive' } } },
          { password: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(status === 'RECEIVED' ? { isReceived: true } : {}),
      ...(status === 'PENDING' || status === 'NOT_RECEIVED' ? { isReceived: false } : {}),
      ...(assignedTo ? { assignedTo: { equals: assignedTo, mode: 'insensitive' } } : {}),
    };

    const returns = await prisma.itrReturn.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, clientCode: true, panNumber: true, itPasswordHash: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const allReturns = await prisma.itrReturn.findMany({
      select: { price: true, isReceived: true, assignedTo: true },
    });

    const totalCount = allReturns.length;
    const puneethCount = allReturns.filter(r => (r.assignedTo || 'Puneeth').toLowerCase() === 'puneeth').length;
    const anilCount = allReturns.filter(r => (r.assignedTo || '').toLowerCase() === 'anil').length;

    const receivedCount = allReturns.filter(r => r.isReceived).length;
    const notReceivedCount = allReturns.filter(r => !r.isReceived).length;
    const totalPrice = allReturns.reduce((sum, r) => sum + (r.price || 0), 0);
    const totalReceivedPrice = allReturns.filter(r => r.isReceived).reduce((sum, r) => sum + (r.price || 0), 0);
    const totalPendingPrice = allReturns.filter(r => !r.isReceived).reduce((sum, r) => sum + (r.price || 0), 0);

    res.json({
      kpis: {
        totalCount,
        puneethCount,
        anilCount,
        receivedCount,
        notReceivedCount,
        totalPrice,
        totalReceivedPrice,
        totalPendingPrice,
      },
      returns,
    });
  } catch (err) {
    console.error('Error fetching ITR workspace:', err);
    res.status(500).json({ message: 'Failed to fetch ITR workspace data', error: err.message });
  }
};

// Update ITR Return status / details
exports.updateItrReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, panNumber, password, price, isReceived, assignedTo, filingStatus } = req.body;

    const existingReturn = await prisma.itrReturn.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!existingReturn) {
      return res.status(404).json({ message: 'ITR record not found' });
    }

    // Update Client if name or panNumber changed
    if (existingReturn.clientId && (name || panNumber)) {
      await prisma.client.update({
        where: { id: existingReturn.clientId },
        data: {
          ...(name ? { name } : {}),
          ...(panNumber ? { panNumber } : {}),
          ...(password ? { itPasswordHash: password } : {}),
        },
      });
    }

    const itrReturn = await prisma.itrReturn.update({
      where: { id },
      data: {
        ...(password !== undefined ? { password } : {}),
        ...(price !== undefined ? { price: parseFloat(price || 0) } : {}),
        ...(isReceived !== undefined ? { isReceived: Boolean(isReceived) } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
        ...(filingStatus ? { filingStatus } : {}),
      },
      include: { client: true },
    });

    res.json(itrReturn);
  } catch (err) {
    console.error('Error updating ITR return:', err);
    res.status(500).json({ message: 'Failed to update ITR record', error: err.message });
  }
};

// Create single ITR Return
exports.createItrReturn = async (req, res) => {
  try {
    const { clientId, name, panNumber, password, price, isReceived, assignedTo } = req.body;

    let targetClientId = clientId;

    if (!targetClientId && name) {
      // Find existing client by PAN or Name, or create a new client
      let client = null;
      if (panNumber) {
        client = await prisma.client.findFirst({
          where: { panNumber: { equals: panNumber.trim(), mode: 'insensitive' } },
        });
      }
      if (!client) {
        client = await prisma.client.findFirst({
          where: { name: { equals: name.trim(), mode: 'insensitive' } },
        });
      }

      if (!client) {
        const clientCount = await prisma.client.count();
        const clientCode = `CAOS-${String(clientCount + 1).padStart(6, '0')}`;
        client = await prisma.client.create({
          data: {
            clientCode,
            name: name.trim(),
            panNumber: panNumber ? panNumber.trim().toUpperCase() : null,
            mobile: '0000000000',
            isItrClient: true,
            itPasswordHash: password || null,
          },
        });
      }
      targetClientId = client.id;
    }

    if (!targetClientId) {
      return res.status(400).json({ message: 'Client ID or Name is required' });
    }

    const itrReturn = await prisma.itrReturn.create({
      data: {
        clientId: targetClientId,
        password: password || null,
        price: parseFloat(price || 0),
        isReceived: isReceived === true || isReceived === 'true' || isReceived === 'RECEIVED',
        assignedTo: assignedTo || 'Puneeth',
        assessmentYear: 'AY 2025-26',
        filingStatus: 'PENDING',
        dueDate: new Date(),
      },
      include: { client: true },
    });

    res.status(201).json(itrReturn);
  } catch (err) {
    console.error('Error creating ITR return:', err);
    res.status(500).json({ message: 'Failed to create ITR record', error: err.message });
  }
};

// Delete ITR Return
exports.deleteItrReturn = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.itrReturn.delete({ where: { id } });
    res.json({ message: 'ITR record deleted successfully' });
  } catch (err) {
    console.error('Error deleting ITR return:', err);
    res.status(500).json({ message: 'Failed to delete ITR record', error: err.message });
  }
};

// Bulk Import ITR Returns from Excel
exports.importItrReturns = async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No ITR rows provided' });
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const name = row['Name'] || row['Client Name'] || row['name'] || '';
        const panNumber = row['PAN Number'] || row['PAN'] || row['panNumber'] || row['pan'] || '';
        const password = row['Password'] || row['itPassword'] || row['password'] || '';
        const price = parseFloat(row['Price'] || row['Amount'] || row['Fee'] || row['price'] || 0);
        const rawReceived = (row['Received or Not'] || row['Received'] || row['Status'] || row['isReceived'] || '').toString().trim().toUpperCase();
        const isReceived = ['YES', 'RECEIVED', 'TRUE', '1', 'PAID'].includes(rawReceived);
        const assignedTo = row['Assigned To'] || row['Assigned'] || row['Owner'] || row['assignedTo'] || 'Puneeth';

        if (!name && !panNumber) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Name or PAN Number required.`);
          continue;
        }

        let client = null;
        if (panNumber) {
          client = await prisma.client.findFirst({
            where: { panNumber: { equals: panNumber.trim(), mode: 'insensitive' } },
          });
        }
        if (!client && name) {
          client = await prisma.client.findFirst({
            where: { name: { equals: name.trim(), mode: 'insensitive' } },
          });
        }

        if (!client) {
          const clientCount = await prisma.client.count();
          const clientCode = `CAOS-${String(clientCount + 1).padStart(6, '0')}`;
          client = await prisma.client.create({
            data: {
              clientCode,
              name: name.trim() || 'Imported Client',
              panNumber: panNumber ? panNumber.trim().toUpperCase() : null,
              mobile: '0000000000',
              isItrClient: true,
              itPasswordHash: password || null,
            },
          });
        }

        await prisma.itrReturn.create({
          data: {
            clientId: client.id,
            password: password || null,
            price,
            isReceived,
            assignedTo: assignedTo.toString().trim(),
            assessmentYear: 'AY 2025-26',
            filingStatus: 'PENDING',
            dueDate: new Date(),
          },
        });

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.json({ message: `Imported ${results.success} ITR records. ${results.failed} failed.`, results });
  } catch (err) {
    console.error('Error importing ITR returns:', err);
    res.status(500).json({ message: 'Failed to import ITR records', error: err.message });
  }
};

// Export ITR returns to JSON for Excel download
exports.exportItrReturns = async (req, res) => {
  try {
    const returns = await prisma.itrReturn.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true, panNumber: true, clientCode: true } },
      },
    });

    const exportData = returns.map((r) => ({
      'Name': r.client?.name || '',
      'PAN Number': r.client?.panNumber || '',
      'Password': r.password || r.client?.itPasswordHash || '',
      'Price': r.price || 0,
      'Received or Not': r.isReceived ? 'Received' : 'Not Received',
      'Assigned To': r.assignedTo || 'Puneeth',
    }));

    res.json({ returns: exportData });
  } catch (err) {
    console.error('Error exporting ITR returns:', err);
    res.status(500).json({ message: 'Failed to export ITR records', error: err.message });
  }
};

exports.triggerItrYearlyReset = async (req, res) => {
  try {
    const { resetItrYearly } = require('../services/cron.service');
    const result = await resetItrYearly();
    res.json({ message: 'Yearly ITR reset executed successfully.', result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to execute yearly ITR reset', error: err.message });
  }
};

