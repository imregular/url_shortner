const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL_ACCELERATE,
}).$extends(withAccelerate());

module.exports = prisma;
