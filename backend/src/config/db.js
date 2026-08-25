const { PrismaClient } = require('@prisma/client');

// Reuse a single PrismaClient instance (important in dev with nodemon reloads).
const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma;

module.exports = prisma;
