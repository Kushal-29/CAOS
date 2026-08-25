const prisma = require('../config/db');

/**
 * Records an entry in the activity_logs table. Called from controllers after
 * any create/update/delete/status-change so every action is traceable, as
 * required by Module 9 (Activity Timeline).
 */
async function logActivity({ userId, clientId, entityType, entityId, action, metadata }) {
  try {
    await prisma.activityLog.create({
      data: { userId, clientId, entityType, entityId, action, metadata },
    });
  } catch (err) {
    // Never let audit logging break the primary request
    console.error('Failed to write activity log:', err.message);
  }
}

module.exports = { logActivity };
