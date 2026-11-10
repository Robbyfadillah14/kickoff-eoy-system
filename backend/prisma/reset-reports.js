const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteReports() {
  console.log("🧹 Menghapus semua data laporan dummy...");
  
  const deleteResult = await prisma.report.deleteMany({});

  console.log(`🎉 Berhasil! Sebanyak ${deleteResult.count} laporan telah dihapus permanen. Dashboard bersih total.`);
}

deleteReports()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });