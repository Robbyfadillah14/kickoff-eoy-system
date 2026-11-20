// prisma/add-direktur-operasional.js — AMAN dijalankan di production: hanya menambah (upsert), tidak menghapus apa pun.
// Jalankan:  node prisma/add-direktur-operasional.js
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();
const randomPin = () => crypto.randomBytes(5).toString("hex").toUpperCase(); // 10 karakter acak, mis. 9F3A1C07BE

async function main() {
  const dept = await prisma.department.upsert({
    where: { name: "Direktur Operasional" },
    update: { isActive: true },
    create: { name: "Direktur Operasional", isActive: true },
  });
  console.log("✅ Departemen:", dept.name, dept.id);

  const plants = await prisma.plant.findMany();
  let n = 0;
  const issued = [];
  for (const p of plants) {
    const exists = await prisma.plantDepartmentAccess.findUnique({ where: { plantId_departmentId: { plantId: p.id, departmentId: dept.id } } });
    if (exists) continue;
    const pin = randomPin();
    await prisma.plantDepartmentAccess.create({ data: { plantId: p.id, departmentId: dept.id, accessCode: pin } });
    issued.push([p.name, pin]);
    n++;
  }
  issued.forEach(([plant, pin]) => console.log(`   PIN Direktur Operasional — ${plant}: ${pin}`));
  console.log(`✅ Akses plant ditambah: ${n} (dari ${plants.length} plant)`);
}
main().catch((e) => { console.error("❌", e); process.exit(1); }).finally(() => prisma.$disconnect());