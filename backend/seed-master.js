const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting manual master seeding...');

  // 1. Create or Update Plants with unique codes
  const plantsData = [
    { name: 'Ekasurya Cikarang', code: 'CKR-01' },
    { name: 'Ekasurya Bali', code: 'BAL-02' },
    { name: 'Ekasurya Semarang', code: 'SMG-03' },
    { name: 'Ekasurya Surabaya', code: 'SBY-04' },
    { name: 'Internusa', code: 'INT-05' },
    { name: 'Ugo Indonesia', code: 'UGO-06' },
  ];

  for (const p of plantsData) {
    await prisma.plant.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }
  
  const cikarangPlant = await prisma.plant.findFirst({ where: { name: 'Ekasurya Cikarang' } });
  console.log('✅ Plants created/verified successfully!');

  // 2. Create or Update Super Admin
  const hashedPassword = await bcrypt.hash('password123', 10);
  const existingAdmin = await prisma.user.findFirst({ where: { email: 'superadmin@kickoff.local' } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin@kickoff.local',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        plantId: cikarangPlant.id,
      },
    });
    console.log('✅ Super Admin created successfully!');
  } else {
    console.log('ℹ️ Super Admin already exists!');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });