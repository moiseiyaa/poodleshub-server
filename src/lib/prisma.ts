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

if (!prismaAlreadyInitialized) {
  const keepAliveInterval = parseInt(process.env.PRISMA_KEEPALIVE_MS || '60000', 10);
  const timer = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error('Prisma keep-alive ping failed:', error);
    }
  }, keepAliveInterval);

  timer.unref();
  globalForPrisma.prismaKeepAliveTimer = timer;
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
