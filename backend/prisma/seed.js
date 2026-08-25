const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Phase 11 Clean Production Wipe: Removing all sample/demo data...');

  // Delete all transactional and client records
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.reminder.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.followUp.deleteMany({});
  await prisma.credentialAccessLog.deleteMany({});
  await prisma.credential.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.taskComment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.gstReturn.deleteMany({});
  await prisma.itrReturn.deleteMany({});
  await prisma.filing.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.noticeAnalysis.deleteMany({});
  await prisma.aiMessage.deleteMany({});
  await prisma.aiConversation.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database wiped clean!');

  // Create single initial Admin User for the production firm
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@caos.dev',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      phone: '+919999999999',
      isActive: true,
      joiningDate: new Date(),
      performanceScore: 100.0,
    },
  });

  console.log(`Production CAOS Initialized! Created Admin Account: ${admin.email} (Password: Admin@123)`);
}

main()
  .catch((e) => {
    console.error('Error during clean seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
