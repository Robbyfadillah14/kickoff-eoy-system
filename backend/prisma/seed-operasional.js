const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai Inject Data Laporan Riil PDF ke SELURUH Plant & Divisi...');

  // 1. Ambil semua Plant yang ada di DB (misal Cikarang, Ugo Indonesia, Surabaya, dll)
  let plants = await prisma.plant.findMany();
  
  if (plants.length === 0) {
    // Jika belum ada plant sama sekali, buatkan
    const p1 = await prisma.plant.create({ data: { name: 'Ekasurya Cikarang', code: 'CKR-01', isHolding: true } });
    const p2 = await prisma.plant.create({ data: { name: 'Ugo Indonesia', code: 'UGO-01', isHolding: false } });
    plants = [p1, p2];
  }

  // 2. Data Riil Laporan 11 Divisi dari Dokumen PPT Kickoff 2026
  const masterReports = [
    {
      dept: 'Purchasing',
      target: 98,
      realized2025: 99.72,
      realized2026: 99.72,
      summary: 'Supplier On-Time Delivery (OTD) mencapai 99.72% (Target 98%). Update LC maksimal 1 hari & evaluasi top supplier 30 hari berjalan konsisten.',
      rgtRun: 'Keterlambatan konfirmasi jadwal kirim dari supplier luar kota & fluktuasi harga bahan baku.',
      rgtGrow: 'Pengembangan minimal 2 supplier alternatif per kategori produk.',
      rgtTransform: 'Otomasi penerbitan PO & pemantauan minimum stock deviation di SAP.'
    },
    {
      dept: 'Export & Import',
      target: 95,
      realized2025: 88.0,
      realized2026: 92.5,
      summary: 'Pengurusan dokumen pabean BC 2.5, BC 4.0, BC 2.7 & FP 070. Distribusi list Gudang Berikat aktif 40 customer.',
      rgtRun: 'Persetujuan kuota impor Kemenperin terbatas (hanya 5% dari pengajuan) & Kenaikan Landed Cost 6.02% akibat Kurs USD.',
      rgtGrow: 'Penambahan minimal 10 customer aktif Gudang Berikat dengan legalitas lengkap.',
      rgtTransform: 'Sertifikasi CDAKB & perpanjangan IPAK untuk produk Alkes Masker Ugo.'
    },
    {
      dept: 'Logistic & Warehouse',
      target: 99,
      realized2025: 100.0,
      realized2026: 99.8,
      summary: 'Total Delivery Order (DO) 8,406 dokumen terproses. On-Time Delivery mencapai 100% dengan Error Delivery 0.02%.',
      rgtRun: 'Ketersediaan armada pengiriman saat peak season & optimasi konsumsi BBM kendaraan operasional.',
      rgtGrow: 'Penataan ulang area simpan gudang & peningkatan efisiensi rute pengiriman driver.',
      rgtTransform: 'Integrasi barcode scanner SAP untuk akurasi stok fisik vs sistem 100%.'
    },
    {
      dept: 'Admin Logistic',
      target: 98,
      realized2025: 92.0,
      realized2026: 95.0,
      summary: 'Pengarsipan PO softcopy & pengawasan status delivery berjalan rapi. Total Invoice terbit 8,158 dokumen.',
      rgtRun: 'Pembatalan invoice/DO sebanyak 240 dokumen akibat revisi harga PO dari customer, PPN 070/010, & perubahan schedule.',
      rgtGrow: 'Peningkatan ketelitian verifikasi PO customer sebelum terbit DO.',
      rgtTransform: 'Digitalisasi sistem konfirmasi penerimaan DO & penagihan elektronik.'
    },
    {
      dept: 'Tax',
      target: 98,
      realized2025: 94.5,
      realized2026: 96.0,
      summary: 'Pengelolaan Faktur Pajak & pelaporan SPT berjalan sesuai ketentuan undang-undang perpajakan.',
      rgtRun: 'Sistem Coretax sering mengalami penyesuaian/error tanpa pemberitahuan & penyesuaian XML SAP.',
      rgtGrow: 'Kolaborasi dengan konsultan pajak untuk analisa risiko perpajakan berkala.',
      rgtTransform: 'Validasi otomatis Faktur Pajak 070 & integrasi Coretax terpadu.'
    },
    {
      dept: 'Admin TF',
      target: 99,
      realized2025: 96.0,
      realized2026: 98.0,
      summary: 'Rekapan penyerahan tagihan luar kota & pengiriman invoice via email/sistem berjalan lancar (1,423 invoice).',
      rgtRun: 'Keterlambatan penerbitan dokumen Goods Receipt (GR) dari customer & kesalahan nomor vendor external.',
      rgtGrow: 'Maksimal keterlambatan Tukar Faktur ditekan di bawah 5 invoice per bulan.',
      rgtTransform: 'Pengembangan portal konfirmasi Tukar Faktur online.'
    },
    {
      dept: 'Finance AP',
      target: 100,
      realized2025: 100.0,
      realized2026: 100.0,
      summary: 'Penyampaian Monthly Report tgl 05, Budget Hutang bulanan 100% tercapai, klaim SPA KCID/KCTM & rekonsiliasi RK SAP aman.',
      rgtRun: 'Ketepatan waktu verifikasi kelengkapan berkas tagihan vendor sebelum tanggal cut-off.',
      rgtGrow: 'Peningkatan efisiensi pengelolaan Petty Cash & OP Cabang.',
      rgtTransform: 'Otomasi 3-Way Matching (PO vs GR vs Invoice AP) di SAP.'
    },
    {
      dept: 'Finance AR',
      target: 98,
      realized2025: 102.06,
      realized2026: 100.0,
      summary: 'Pencapaian piutang USD & IDR melebihi target. Monitoring ketat piutang jatuh tempo & penagihan berjalan.',
      rgtRun: 'Bad debt terdeteksi sebesar Rp 784 Juta (3.6%) dari total piutang pada beberapa customer bermasalah.',
      rgtGrow: 'Penerapan ketat prosedur Hold Shipment untuk customer yang melebihi batas credit limit/tempo.',
      rgtTransform: 'Sistem otomatisasi reminder penagihan piutang via Email/WA Bot.'
    },
    {
      dept: 'Finance Department',
      target: 95,
      realized2025: 93.0,
      realized2026: 96.5,
      summary: 'Penyampaian Monthly Budget Report tgl 05 & Sales Report tgl 12/16 rutin dikirimkan ke Executive Management.',
      rgtRun: 'Alokasi dana cadangan dari net profit belum memenuhi porsi ideal 10%.',
      rgtGrow: 'Pengawasan ketat alokasi cash flow & peninjauan reimbursement operasional.',
      rgtTransform: 'Penyusunan Executive Dashboard Cash Flow & Profitability Real-Time.'
    },
    {
      dept: 'Accounting',
      target: 98,
      realized2025: 91.0,
      realized2026: 95.0,
      summary: 'Laporan pajak konsultan semesteran & analisa cost center per 2 bulan berjalan lancar. Cek fisik aset rutin bersama HRD.',
      rgtRun: 'Penutupan buku bulanan (Closing) tgl 25 masih sering bergeser karena kelengkapan data cabang.',
      rgtGrow: 'Peningkatan akurasi pencatatan Turnover Ending Inventory berdasarkan HPP & Omset per kategori.',
      rgtTransform: 'Otomatisasi jurnal penyesuaian dan penyusutan aset terintegrasi SAP.'
    },
    {
      dept: 'HR & MR',
      target: 95,
      realized2025: 89.0,
      realized2026: 94.0,
      summary: 'Management Review, BCP/BCM, program pelatihan HRD 100%, serta perpanjangan Sertifikasi ISO TUV Rheinland sukses.',
      rgtRun: 'Tingkat keterlambatan karyawan dijaga maks 2% & ketidakhadiran maks 1%. Peningkatan koordinasi customer audit.',
      rgtGrow: 'Pengembangan talenta internal, pelaksanaan evaluasi KPI karyawan, & program CSR perusahaan.',
      rgtTransform: 'Implementasi HRIS terpadu untuk absensi, KPI, & audit mutu ISO.'
    }
  ];

  const years = [2025, 2026, 2027];
  let totalInserted = 0;

  // 3. Inject ke SEMUA Plant dan SEMUA Divisi
  for (const plant of plants) {
    for (const item of masterReports) {
      // Upsert department
      const dept = await prisma.department.upsert({
        where: { name: item.dept },
        update: { isActive: true },
        create: { name: item.dept, isActive: true }
      });

      for (const yr of years) {
        const finalRealized = yr === 2025 ? item.realized2025 : yr === 2027 ? Math.min(100, item.target + 1) : item.realized2026;

        const payload = {
          year: yr,
          plantId: plant.id,
          departmentId: dept.id,
          status: 'APPROVED',
          achievementSummary: item.summary,
          metricsJson: JSON.stringify({
            targetPct: item.target,
            realizedPct: finalRealized,
            target: `${item.target}%`,
            realized: `${finalRealized}%`,
            status: "Verified"
          }),
          rgtRun: item.rgtRun,
          rgtGrow: item.rgtGrow,
          rgtTransform: item.rgtTransform
        };

        await prisma.report.upsert({
          where: {
            year_plantId_departmentId: {
              year: yr,
              plantId: plant.id,
              departmentId: dept.id
            }
          },
          update: payload,
          create: payload
        });

        totalInserted++;
      }
    }
  }

  console.log(`✅ BERHASIL! Total ${totalInserted} data laporan ter-inject ke ${plants.length} plant untuk seluruh 11 divisi!`);
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });