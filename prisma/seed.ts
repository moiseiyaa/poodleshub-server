import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Resetting database...');

  // Wipe all data
  await prisma.emailLog.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.puppy.deleteMany({});
  await prisma.breed.deleteMany({});
  await prisma.adminUser.deleteMany({});

  // Create admin user
  const adminEmail = 'admin@puppyhub.com';
  const plainPassword = 'password123';
  const hashed = await bcrypt.hash(plainPassword, 10);
  await prisma.adminUser.create({
    data: {
      email: adminEmail,
      password: hashed,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
    }
  });
  console.log(`👤 Admin Created: ${adminEmail} / ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
