const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai Recovery Master Data Lengkap (Semua Plant & 14 Departemen)...');

  // 1. Bersihkan relasi turunan agar aman
  await prisma.report.deleteMany({});
  await prisma.plantDepartmentAccess.deleteMany({});
  console.log('🧹 Data laporan & akses dibersihkan.');

  // 2. Masukkan SEMUA Master Plant / Cabang secara lengkap
  const plantsData = [
    { name: 'Ekasurya Cikarang', code: 'CKR-01', isHolding: true },
    { name: 'Ekasurya Bali', code: 'BALI-01', isHolding: false },
    { name: 'Ekasurya Surabaya', code: 'SBY-01', isHolding: false },
    { name: 'Ekasurya Semarang', code: 'SMG-01', isHolding: false },
    { name: 'Internusa', code: 'INT-01', isHolding: false },
    { name: 'Ugo Indonesia', code: 'UGO-01', isHolding: false }
  ];

  for (const p of plantsData) {
    await prisma.plant.upsert({
      where: { code: p.code },
      update: { name: p.name, isHolding: p.isHolding },
      create: p
    });
  }
  console.log('✅ SEMUA 6 Plant/Cabang berhasil dipulihkan!');

  // 3. Master 14 Departemen Resmi (Pastikan Product Development ada di sini)
  const masterDepartments = [
    { dept: 'Sales & Sales Support', isSales: true, summary: 'Pencapaian target penjualan dengan fokus efisiensi margin profitabilitas & akun korporat B2B.' },
    { dept: 'Purchasing', isSales: false, summary: 'Pengelolaan rantai pasok material dengan Supplier On-Time Delivery (OTD) optimal.' },
    { dept: 'Export & Import', isSales: false, summary: 'Pengurusan dokumen pabean BC 2.5, 4.0, 2.7 & FP 070 Gudang Berikat.' },
    { dept: 'Logistic & Warehouse', isSales: false, summary: 'Total Delivery Order (DO) terproses lancar dengan On-Time Delivery logistik 99.8%.' },
    { dept: 'Admin Logistic', isSales: false, summary: 'Pengarsipan PO softcopy & pengawasan status delivery berjalan rapi.' },
    { dept: 'Tax', isSales: false, summary: 'Pengelolaan Faktur Pajak & pelaporan SPT sesuai ketentuan perpajakan.' },
    { dept: 'Admin TF', isSales: false, summary: 'Rekapan penyerahan tagihan luar kota & pengiriman invoice via email/sistem lancar.' },
    { dept: 'Finance AP', isSales: false, summary: 'Penyampaian Monthly Report tgl 05, Budget Hutang bulanan 100% tercapai.' },
    { dept: 'Finance AR', isSales: false, summary: 'Pencapaian penagihan piutang USD & IDR optimal dengan monitoring jatuh tempo ketat.' },
    { dept: 'Finance Department', isSales: false, summary: 'Penyampaian Monthly Budget Report tgl 05 & Sales Report tgl 12/16 rutin ke BOD.' },
    { dept: 'Accounting', isSales: false, summary: 'Laporan pajak konsultan semesteran & analisa cost center per 2 bulan.' },
    { dept: 'HR & MR', isSales: false, summary: 'Management Review, BCP/BCM, program pelatihan 100%, & sertifikasi ISO.' },
    { dept: 'Digital Marketing', isSales: true, summary: 'Pengembangan strategi kampanye digital, leads generation, dan optimasi brand presence korporat.' },
    { dept: 'Product Development', isSales: true, summary: 'Riset inovasi produk baru, peningkatan kualitas portofolio, dan ekspansi lini produk bernilai margin tinggi.' }
  ];

  for (const item of masterDepartments) {
    await prisma.department.upsert({
      where: { name: item.dept },
      update: { isActive: true },
      create: { name: item.dept, isActive: true }
    });
  }
  console.log('✅ SEMUA 14 Departemen (Termasuk Product Development) berhasil dipulihkan!');

  // 4. Hubungkan Akses Plant ke Departemen & Isi Data Laporan (2024-2027) untuk SEMUA Plant
  const allPlants = await prisma.plant.findMany();
  const allDepts = await prisma.department.findMany();
  const years = [2024, 2025, 2026, 2027];
  let totalReports = 0;

  for (const plant of allPlants) {
    for (const dept of allDepts) {
      await prisma.plantDepartmentAccess.create({
        data: {
          plantId: plant.id,
          departmentId: dept.id,
          accessCode: `${plant.code}-${dept.name.substring(0, 3).toUpperCase()}-FULL`
        }
      }).catch(() => {});

      const isSales = dept.name.includes('Sales') || dept.name.includes('Marketing') || dept.name.includes('Product');

      for (const yr of years) {
        const variance = yr === 2024 ? -3.5 : yr === 2025 ? -1.2 : yr === 2027 ? 2.0 : 0;

        const metricsObj = {
          salesType: isSales ? 'PROFIT' : 'OMZET',
          targetAchievedPct: Math.min(100, Math.max(88, 96 + variance)),
          kpiList: [
            { id: Date.now() + yr + Math.random(), title: `Kinerja Utama ${dept.name}`, val: `${Math.min(100, 95 + variance)}%`, note: `Capaian tahun ${yr}`, unit: '%', period: 'Bulanan', pic: 'PIC Divisi' }
          ],
          weeklyRevenue: ["120M", "135M", "148M", "160M", "175M", "190M"],
          arpu: isSales ? "Rp 1.4 M / Client" : "-",
          clv: isSales ? "Rp 12.5 M" : "-",
          cac: isSales ? "Rp 3.8 M" : "-"
        };

        await prisma.report.create({
          data: {
            year: yr,
            plantId: plant.id,
            departmentId: dept.id,
            status: 'APPROVED', // WAJIB APPROVED AGAR MUNCUL DI DASHBOARD
            achievementSummary: `Laporan resmi operasional dan strategis divisi ${dept.name} ${plant.name} periode tahun ${yr}.`,
            metricsJson: metricsObj,
            rgtRun: `Penguatan operasional harian divisi ${dept.name}.`,
            rgtGrow: `Perluasan efisiensi dan pengembangan cakupan ${dept.name}.`,
            rgtTransform: `Digitalisasi sistem terintegrasi SAP ERP.`,
            challenges: [{ title: `Dinamika operasional & penyesuaian target ${dept.name}` }],
            opportunities: [{ title: `Otomasi workflow & peningkatan efisiensi kerja` }]
          }
        });
        totalReports++;
      }
    }
  }

  console.log(`✅ SUKSES BESAR! ${allPlants.length} Plant, 14 Departemen (Termasuk Product Development), & ${totalReports} laporan berhasil di-seed!`);
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });