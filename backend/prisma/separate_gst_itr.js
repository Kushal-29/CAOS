require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Separating GST clients from ITR clients...');

  // Update imported clients from GST spreadsheet to be isGstClient: true, isItrClient: false
  // Unless their work tag explicitly mentions ITR
  const clients = await prisma.client.findMany({
    where: { isGstClient: true },
  });

  let count = 0;
  for (const client of clients) {
    const isPureGst = !client.businessType || !client.businessType.toUpperCase().includes('ITR');
    if (isPureGst) {
      // Set isItrClient to false
      await prisma.client.update({
        where: { id: client.id },
        data: { isItrClient: false },
      });

      // Remove any dummy ItrReturn records for this pure GST client
      await prisma.itrReturn.deleteMany({
        where: { clientId: client.id },
      });

      count++;
    }
  }

  console.log(`Updated ${count} pure GST clients: removed them from ITR Workspace.`);
}

run()
  .catch((err) => {
    console.error('Error separating GST and ITR clients:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
