import { PrismaClient } from '@prisma/client';

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient;
  prismaKeepAliveTimer?: NodeJS.Timeout;
};

const globalForPrisma = global as PrismaGlobal;
const prismaAlreadyInitialized = Boolean(globalForPrisma.prisma);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

// Test database connection immediately
if (!prismaAlreadyInitialized) {
  console.log('🔍 Testing database connection...');
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connected successfully');
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error);
      console.error('DATABASE_URL format check:', process.env.DATABASE_URL ? 'SET' : 'MISSING');
    });
}

// Keep-alive logic removed for serverless environments

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
