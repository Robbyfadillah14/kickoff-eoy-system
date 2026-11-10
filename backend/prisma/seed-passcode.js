const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const plantActiveDepartments = {
  "Ekasurya Cikarang": ["Purchasing", "Export & Import", "Logistic & Warehouse", "Admin Logistic", "Tax", "Admin TF", "Finance AP", "Finance AR", "Accounting", "HR & MR", "Sales & Sales Support", "Digital Marketing"],
  "Ekasurya Bali": ["Purchasing", "Logistic & Warehouse", "Finance AP", "Finance AR", "HR & MR", "Sales & Sales Support"],
  "Ekasurya Semarang": ["Purchasing", "Logistic & Warehouse", "Admin Logistic", "Finance AP", "HR & MR", "Sales & Sales Support"],
  "Ekasurya Surabaya": ["Purchasing", "Export & Import", "Logistic & Warehouse", "Tax", "Finance AP", "Finance AR", "Accounting", "HR & MR", "Sales & Sales Support", "Digital Marketing"],
  "Internusa": ["Purchasing", "Logistic & Warehouse", "Finance AP", "HR & MR", "Sales & Sales Support"],
  "Ugo Indonesia": ["Purchasing", "Logistic & Warehouse", "Admin Logistic", "Finance AP", "Accounting", "HR & MR", "Sales & Sales Support"]
};

async function main() {
  console.log("🔑 Memulai pembuatan Passcode / PIN per Plant & Divisi...");
  const plants = await prisma.plant.findMany();
  const departments = await prisma.department.findMany();
  let count = 0;

  for (const plant of plants) {
    const activeDepts = plantActiveDepartments[plant.name] || [];
    for (const deptName of activeDepts) {
      const dept = departments.find(d => d.name === deptName);
      if (!dept) continue;
      const cleanCode = dept.name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
      
      // PERHATIKAN BAGIAN INI: Menggunakan backticks ` `
      const accessCode = `${plant.code}-${cleanCode}-2026`;

      await prisma.plantDepartmentAccess.upsert({
        where: { plantId_departmentId: { plantId: plant.id, departmentId: dept.id } },
        update: { accessCode: accessCode },
        create: { plantId: plant.id, departmentId: dept.id, accessCode: accessCode }
      });
      console.log(`📌 Plant: [${plant.name}] | Divisi: [${dept.name}] ==> PIN: ${accessCode}`);
      count++;
    }
  }
  console.log(`🎉 Sukses! Sebanyak ${count} Passcode divisi berhasil digenerate.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });