const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Monthly GST Reset Logic (Runs at 00:00 on the 1st day of every month)
async function resetGstMonthly() {
  try {
    console.log('[CRON SERVICE] Running Monthly GST Reset...');
    const result = await prisma.gstReturn.updateMany({
      data: {
        status: 'PENDING',
        filedDate: null,
        ackNumber: null,
      },
    });
    console.log(`[CRON SERVICE] Successfully reset ${result.count} GST returns to PENDING.`);
    return result;
  } catch (err) {
    console.error('[CRON SERVICE] Failed to reset GST monthly returns:', err);
    throw err;
  }
}

// Yearly ITR Reset Logic (Runs at 00:00 on May 1st every year)
async function resetItrYearly() {
  try {
    console.log('[CRON SERVICE] Running Yearly ITR Reset (May 1st)...');
    const result = await prisma.itrReturn.updateMany({
      data: {
        isReceived: false,
        filingStatus: 'PENDING',
        filedDate: null,
      },
    });
    console.log(`[CRON SERVICE] Successfully reset ${result.count} ITR returns to NOT RECEIVED.`);
    return result;
  } catch (err) {
    console.error('[CRON SERVICE] Failed to reset ITR yearly returns:', err);
    throw err;
  }
}

// Initialize automated scheduled cron jobs
function initCronScheduler() {
  console.log('[CRON SERVICE] Initializing Automated Reset Scheduler...');

  // 1. GST Monthly Reset: 0 0 1 * * (Midnight on 1st day of every month)
  cron.schedule('0 0 1 * *', async () => {
    console.log('[CRON JOB TRIGGERED] Monthly GST Reset started.');
    await resetGstMonthly();
  });

  // 2. ITR Yearly Reset: 0 0 1 5 * (Midnight on May 1st every year)
  cron.schedule('0 0 1 5 *', async () => {
    console.log('[CRON JOB TRIGGERED] Yearly ITR Reset started (May 1st).');
    await resetItrYearly();
  });

  console.log('[CRON SERVICE] Scheduler Active: GST Monthly Reset (1st of month) & ITR Yearly Reset (May 1st).');
}

module.exports = {
  initCronScheduler,
  resetGstMonthly,
  resetItrYearly,
};
