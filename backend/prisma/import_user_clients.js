require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { encryptSecret } = require('../src/utils/crypto');

const prisma = new PrismaClient();

const rawData = [
  { name: 'Antony', username: '29ABCCS8504K1ZY', password: 'Antony@1234', work: 'TDS & PT', freq: 'MONTHLY' },
  { name: 'Nikhil (Edubrics)', username: 'edubrics_123', password: 'Nikhil#1234', work: 'Monthly', freq: 'MONTHLY' },
  { name: 'Suhas', username: 'WoodenCladders', password: 'Password@1234', work: 'GST', freq: 'MONTHLY' },
  { name: 'We care School', username: 'PYPNY3279123000', password: '4885720', work: 'PF & ESI', freq: 'MONTHLY' },
  { name: 'Ashok Aspiring', username: 'asprink_25', password: 'Ashok@1234', work: 'PT,GST&TDS', freq: 'MONTHLY' },
  { name: 'Mahalashmi Provission Store (Renuka)', username: 'Renuka_0507', password: 'Password@12345', work: 'GST', freq: 'MONTHLY' },
  { name: 'Shaik Vimol ref, Ecepted sales (Rice & Mango)', username: 'SABRICE23', password: 'Password@12345', work: 'GST', freq: 'MONTHLY' },
  { name: 'Niranjan', username: 'SLVNiranja_2025', password: 'Password@1234', work: 'GST', freq: 'MONTHLY' },
  { name: 'Ramya Narasapura, (Medical shop)', username: 'Ramyavani123', password: 'Puneeth@123', work: 'GST', freq: 'QUARTERLY' },
  { name: 'Yathish Clinteck(HR)', username: 'Yathish_202509', password: 'Password@1234', work: 'GST', freq: 'MONTHLY' },
  { name: 'Ashiq Khan', username: 'Rehana_092025', password: 'Password@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'Yashwanth', username: 'Yashwant_122025', password: 'Password@1234', work: 'GST', freq: 'MONTHLY' },
  { name: 'Ashok Gurumurthy Road Somaun', username: 'Ashok_112025', password: 'Password@1234', work: 'GST', freq: 'MONTHLY' },
  { name: 'Sumith', username: 'Sumit_112025', password: 'Sumit@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'Abdul', username: 'Aone_112025', password: 'Password@1234', work: 'GST', freq: 'MONTHLY' },
  { name: 'Karku suneetha devi Vijay wife', username: 'Karuku_112025', password: 'Password@12345', work: 'GST', freq: 'MONTHLY' },
  { name: 'Samsul Sain Begam', username: 'Saina_112025', password: 'Password@1234', work: 'GST', freq: 'MONTHLY' },
  { name: 'Hemanth Kumar T', username: 'Hemanth_122025', password: 'Password@1234', work: 'GST', freq: 'MONTHLY' },
  { name: 'Siyan sing Nunia Khan ref', username: 'SSN.Security24', password: 'Password@12345', work: 'GST,PF,ESI', freq: 'MONTHLY' },
  { name: 'Hanif', username: 'Hanif_022026', password: 'Password@1234', work: 'GST', freq: 'MONTHLY' },
  { name: 'Padma Khan ref', username: 'Padmakushal.26', password: 'Password@1234', work: 'GST', freq: 'MONTHLY' },
  { name: 'Dhamesh Somasun', username: 'viviramesh', password: 'Password@123', work: 'GST', freq: 'QUARTERLY' },
  { name: 'Core management Facility', username: 'Salimkhan_2026', password: 'Password@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'Bangalore Security Information', username: 'Lakhi_0326', password: 'Password@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'P P Habee Ukail', username: 'Habee_0326', password: 'Password@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'Avani Studios Suhas', username: 'Avani_Studios', password: 'Password@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'Sarmistha(Shubham Mother )', username: 'Sarmistha_2026', password: 'Password@123', work: 'GST', freq: 'QUARTERLY' },
  { name: 'Mitali Rabidas BSS', username: 'Best-Security', password: 'Password@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'Hotel grands', username: 'Hotel_grands', password: 'Password@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'KNR_Venchures (Roopa, chickpet done biriyani)', username: 'KNR_Roopa', password: 'Password@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'Shaik Karthik ref', username: 'Shaik_112025', password: 'Password@1234', work: 'GST', freq: 'MONTHLY' },
  { name: 'Saaketh Suhas ref', username: 'Saaketh_2026', password: 'Saaketh@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'Pooja Kutty Hosapalya', username: 'Pooja_31072026', password: 'Password@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'Gangadhar Babu', username: 'Brightbric_2026', password: 'Puneeth@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'Getlux', username: 'PYKRM4050169000', password: 'Password@123', work: 'PF & ESI', freq: 'MONTHLY' },
  { name: 'Raju (Auto mobile assosaries, Harlur)', username: 'khraju22', password: 'Puneeth@123', Work: 'GST', freq: 'MONTHLY' },
  { name: 'Roja Owner Aunty', username: 'Roja_Ajay', password: 'Password@123', work: 'GST', freq: 'MONTHLY' },
  { name: 'Sachin(Gangadhar babu ref, Hubli)', username: 'Sachin_082026', password: 'Password@123', work: 'GST', freq: 'MONTHLY' },
];

async function run() {
  console.log(`Starting import of ${rawData.length} real GST client records...`);

  // Get initial count for sequential client codes
  let count = await prisma.client.count();

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i];
    count++;
    const clientCode = `CAOS-${count.toString().padStart(6, '0')}`;
    const dummyMobile = `98450${(10005 + i).toString()}`;
    const isGst = item.work ? (item.work.includes('GST') || item.work.includes('Monthly')) : true;

    // Check if client already exists by name
    let client = await prisma.client.findFirst({ where: { name: item.name } });

    if (!client) {
      client = await prisma.client.create({
        data: {
          clientCode,
          name: item.name,
          mobile: dummyMobile,
          state: 'Karnataka',
          businessType: item.work || 'GST & Tax Services',
          status: 'ACTIVE',
          isGstClient: isGst,
          isItrClient: false,
          gstUsername: item.username,
          gstFilingFrequency: item.freq === 'QUARTERLY' ? 'QUARTERLY' : 'MONTHLY',
        },
      });
      console.log(`Created Client: [${client.clientCode}] ${client.name}`);
    }

    // Encrypt & Store Portal Credential in Encrypted Credential Vault
    if (item.username && item.password) {
      const encryptedSecret = encryptSecret(item.password);

      // Upsert Credential
      const existingCred = await prisma.credential.findFirst({
        where: { clientId: client.id, type: 'GST' },
      });

      if (existingCred) {
        await prisma.credential.update({
          where: { id: existingCred.id },
          data: { portalUsername: item.username, encryptedSecret },
        });
      } else {
        await prisma.credential.create({
          data: {
            clientId: client.id,
            type: 'GST',
            portalUsername: item.username,
            encryptedSecret,
          },
        });
      }
    }

    // Create GSTR-1 and GSTR-3B return records for Feb 2026
    if (isGst) {
      const existingReturn = await prisma.gstReturn.findFirst({
        where: { clientId: client.id, period: 'Feb 2026' },
      });

      if (!existingReturn) {
        await prisma.gstReturn.createMany({
          data: [
            {
              clientId: client.id,
              period: 'Feb 2026',
              returnType: 'GSTR1',
              status: 'PENDING',
              dueDate: new Date('2026-03-11'),
            },
            {
              clientId: client.id,
              period: 'Feb 2026',
              returnType: 'GSTR3B',
              status: 'PENDING',
              dueDate: new Date('2026-03-20'),
            },
          ],
        });
      }
    }
  }

  console.log(`Successfully imported all ${rawData.length} GST clients with encrypted credentials and returns!`);
}

run()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
