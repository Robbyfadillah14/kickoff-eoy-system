const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔑 Memulai pembuatan Passcode / PIN...');
  const plants = await prisma.plant.findMany();
  const departments = await prisma.department.findMany();
  let count = 0;

  for (const plant of plants) {
    for (const dept of departments) {
      const cleanCode = dept.name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
      const accessCode = plant.code + '-' + cleanCode + '-2026';
      
      await prisma.plantDepartmentAccess.upsert({
        where: { plantId_departmentId: { plantId: plant.id, departmentId: dept.id } },
        update: { accessCode: accessCode },
        create: { plantId: plant.id, departmentId: dept.id, accessCode: accessCode }
      });
      count++;
    }
  }
  console.log('🎉 Sukses! Sebanyak ' + count + ' Passcode berhasil digenerate.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
