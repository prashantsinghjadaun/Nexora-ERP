import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting database seed for Nexora ERP development users...');

  const seedUsers = [
    {
      email: 'admin@nexora.com',
      password: 'Admin@123456',
      fullName: 'System Administrator',
      role: Role.ADMIN,
    },
    {
      email: 'sales@nexora.com',
      password: 'Sales@123456',
      fullName: 'Sales Executive',
      role: Role.SALES,
    },
    {
      email: 'warehouse@nexora.com',
      password: 'Warehouse@123456',
      fullName: 'Warehouse Manager',
      role: Role.WAREHOUSE,
    },
    {
      email: 'accounts@nexora.com',
      password: 'Accounts@123456',
      fullName: 'Financial Auditor',
      role: Role.ACCOUNTS,
    },
  ];

  for (const user of seedUsers) {
    const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

    const upsertedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        role: user.role,
        passwordHash,
        isActive: true,
      },
      create: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        passwordHash,
        isActive: true,
      },
    });

    console.log(`✅ Seeded user: ${upsertedUser.email} (${upsertedUser.role})`);
  }

  console.log('✨ Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Database seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
