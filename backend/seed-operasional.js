const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai pengisian data lengkap untuk seluruh 11 Divisi Operasional...');

  // 1. Ambil plant pertama yang ada di database secara otomatis
  let plant = await prisma.plant.findFirst();
  if (!plant) {
    plant = await prisma.plant.create({
      data: { name: 'Ekasurya Cikarang', code: 'CKR-01', isHolding: true }
    });
  }
  console.log(`📍 Menggunakan Plant: ${plant.name}`);

  // 2. Daftar Lengkap 11 Divisi beserta Metrik, Highlights, Bottleneck, & KPI List sesuai Dokumen PDF Kickoff 2026
  const masterDepartments = [
    {
      name: 'Purchasing',
      targetPct: 98.0,
      realizedPct: 99.72,
      targetStr: '98%',
      realizedStr: '99.72%',
      summary: 'Supplier On-Time Delivery (OTD) rata-rata mencapai 99.72% (Melampaui target 98%). Update LC maksimal 1 hari & evaluasi top supplier 30 hari berjalan konsisten.',
      rgtRun: 'Keterlambatan konfirmasi jadwal kirim dari supplier luar kota & fluktuasi harga bahan baku.',
      rgtGrow: 'Pengembangan minimal 2 supplier alternatif per kategori produk.',
      rgtTransform: 'Otomasi penerbitan PO & pemantauan minimum stock deviation di SAP.',
      kpiList: [
        'Supplier On-Time Delivery (OTD) min 98%',
        'Evaluasi top supplier & 30 days min 2 suppliers',
        'Update LC maksimal 1 hari',
        'Stock Opname (STO) 3 bulanan & monitoring stock minimum deviation'
      ]
    },
    {
      name: 'Export & Import',
      targetPct: 95.0,
      realizedPct: 92.5,
      targetStr: '10 Kuota',
      realizedStr: '92.5%',
      summary: 'Pengurusan dokumen pabean BC 2.5, BC 4.0, BC 2.7 & FP 070. Distribusi list Gudang Berikat aktif mencakup 40 customer.',
      rgtRun: 'Persetujuan kuota impor Kemenperin terbatas (hanya 5% dari pengajuan) & Kenaikan Landed Cost 6.02% akibat Kurs USD.',
      rgtGrow: 'Penambahan minimal 10 customer aktif Gudang Berikat dengan legalitas lengkap.',
      rgtTransform: 'Sertifikasi CDAKB & perpanjangan IPAK untuk produk Alkes Masker Ugo.',
      kpiList: [
        'Penambahan customer distribusi Gudang Berikat min 10',
        'Kesesuaian dokumen BC 2.5, 4.0, 2.7 & FP 070 aktual tanpa cancel',
        'Pengurusan kuota impor kemenperin & efisiensi landed cost (Target 5.5%)',
        'Perpanjangan IPAK & sertifikasi CDAKB'
      ]
    },
    {
      name: 'Logistic & Warehouse',
      targetPct: 99.0,
      realizedPct: 100.0,
      targetStr: '99%',
      realizedStr: '100%',
      summary: 'Total Delivery Order (DO) 8,406 dokumen terproses. On-Time Delivery mencapai 100% dengan Error Delivery sangat rendah (0.02%).',
      rgtRun: 'Ketersediaan armada pengiriman saat peak season & optimasi konsumsi BBM kendaraan operasional.',
      rgtGrow: 'Penataan ulang area simpan gudang & peningkatan efisiensi rute pengiriman driver.',
      rgtTransform: 'Integrasi barcode scanner SAP untuk akurasi stok fisik vs sistem 100%.',
      kpiList: [
        'On-Time Delivery (OTD) Target 99%',
        'Pengendalian kesalahan delivery (Error Rate 0%)',
        'Ketepatan waktu tukar faktur harian',
        'Kesesuaian aktual stock 100%'
      ]
    },
    {
      name: 'Admin Logistic',
      targetPct: 98.0,
      realizedPct: 95.0,
      targetStr: '98%',
      realizedStr: '95%',
      summary: 'Pengarsipan PO softcopy & pengawasan status delivery berjalan rapi. Total Invoice terbit 8,158 dokumen.',
      rgtRun: 'Pembatalan invoice/DO sebanyak 240 dokumen akibat revisi harga PO dari customer, PPN 070/010, & perubahan schedule.',
      rgtGrow: 'Peningkatan ketelitian verifikasi PO customer sebelum terbit DO.',
      rgtTransform: 'Digitalisasi sistem konfirmasi penerimaan DO & penagihan elektronik.',
      kpiList: [
        'Arsip PO berbasis softcopy',
        'Update status pengiriman & delivery request customer',
        'Pengelolaan perubahan jadwal & revisi dokumen',
        'Monitoring pembatalan invoice (Internal max 100, Eksternal max 200 lbr)'
      ]
    },
    {
      name: 'Tax',
      targetPct: 98.0,
      realizedPct: 96.0,
      targetStr: '98%',
      realizedStr: '96%',
      summary: 'Pengelolaan Faktur Pajak & pelaporan SPT berjalan sesuai ketentuan undang-undang perpajakan yang berlaku.',
      rgtRun: 'Sistem Coretax baru sering mengalami penyesuaian/error tanpa pemberitahuan & penyesuaian file XML SAP.',
      rgtGrow: 'Kolaborasi dengan konsultan pajak untuk analisa risiko perpajakan berkala.',
      rgtTransform: 'Validasi otomatis Faktur Pajak 070 & integrasi Coretax terpadu.',
      kpiList: [
        'Faktur pajak revisi maksimal 2%',
        'Faktur pajak batal maksimal 1%',
        'Monitoring kendala sistem Coretax & validasi XML SAP',
        'Penyelesaian error dokumen pajak terdampak'
      ]
    },
    {
      name: 'Admin TF',
      targetPct: 99.0,
      realizedPct: 98.0,
      targetStr: '99%',
      realizedStr: '98%',
      summary: 'Rekapan penyerahan tagihan luar kota & pengiriman invoice via email/sistem berjalan lancar (1,423 invoice total).',
      rgtRun: 'Keterlambatan penerbitan dokumen Goods Receipt (GR) dari customer & kesalahan nomor vendor external.',
      rgtGrow: 'Maksimal keterlambatan Tukar Faktur ditekan di bawah 5 invoice per bulan.',
      rgtTransform: 'Pengembangan portal konfirmasi Tukar Faktur online.',
      kpiList: [
        'Tagihan luar kota tercapai 98%',
        'Maksimal telat Tukar Faktur 5 invoice / bulan',
        'Rekapan invoice send by email & sistem 99%',
        'Pengendalian revisi/reprint dokumen tagihan'
      ]
    },
    {
      name: 'Finance AP',
      targetPct: 100.0,
      realizedPct: 100.0,
      targetStr: '100%',
      realizedStr: '100%',
      summary: 'Penyampaian Monthly Report tgl 05, Budget Hutang bulanan 100% tercapai, klaim SPA KCID/KCTM & rekonsiliasi RK SAP aman.',
      rgtRun: 'Ketepatan waktu verifikasi kelengkapan berkas tagihan vendor sebelum tanggal cut-off.',
      rgtGrow: 'Peningkatan efisiensi pengelolaan Petty Cash & OP Cabang.',
      rgtTransform: 'Otomasi 3-Way Matching (PO vs GR vs Invoice AP) di SAP.',
      kpiList: [
        'Kirim Monthly Report setiap tanggal 05',
        'Budget hutang bulanan tercapai 100%',
        'Update kartu hutang & input di SAP',
        'Crosscheck uang keluar masuk antara RK dan SAP'
      ]
    },
    {
      name: 'Finance AR',
      targetPct: 98.0,
      realizedPct: 102.0,
      targetStr: '98%',
      realizedStr: '102%',
      summary: 'Pencapaian piutang USD & IDR melebihi target. Monitoring ketat piutang jatuh tempo & penagihan berjalan.',
      rgtRun: 'Bad debt terdeteksi sebesar Rp 784 Juta (3.6%) dari total piutang pada beberapa customer bermasalah.',
      rgtGrow: 'Penerapan ketat prosedur Hold Shipment untuk customer yang melebihi batas credit limit/tempo.',
      rgtTransform: 'Sistem otomatisasi reminder penagihan piutang via Email/WA Bot.',
      kpiList: [
        'Piutang tertagih tepat waktu 98% IDR',
        'Piutang tertagih tepat waktu 98% USD',
        'Meminimalisir Bad Debt maksimal 1%',
        'Monitoring customer overdue & hold shipment'
      ]
    },
    {
      name: 'Finance Department',
      targetPct: 95.0,
      realizedPct: 96.5,
      targetStr: '95%',
      realizedStr: '96.5%',
      summary: 'Penyampaian Monthly Budget Report tgl 05 & Sales Report tgl 12/16 rutin dikirimkan ke Executive Management.',
      rgtRun: 'Alokasi dana cadangan dari net profit belum memenuhi porsi ideal 10%.',
      rgtGrow: 'Pengawasan ketat alokasi cash flow & peninjauan reimbursement operasional.',
      rgtTransform: 'Penyusunan Executive Dashboard Cash Flow & Profitability Real-Time.',
      kpiList: [
        'Alokasi Dana Cadangan 10% dari Net Profit',
        'Reporting Budget Hutang & Piutang maksimal tgl 05 ke management',
        'Reporting sales setiap tanggal 16 setiap bulannya',
        'Weekly financial update'
      ]
    },
    {
      name: 'Accounting',
      targetPct: 98.0,
      realizedPct: 95.0,
      targetStr: '98%',
      realizedStr: '95%',
      summary: 'Laporan pajak konsultan semesteran & analisa cost center per 2 bulan berjalan lancar. Cek fisik aset rutin bersama HRD.',
      rgtRun: 'Penutupan buku bulanan (Closing) tgl 25 masih sering bergeser karena kelengkapan data cabang.',
      rgtGrow: 'Peningkatan akurasi pencatatan Turnover Ending Inventory berdasarkan HPP & Omset per kategori.',
      rgtTransform: 'Otomatisasi jurnal penyesuaian dan penyusutan aset terintegrasi SAP.',
      kpiList: [
        'Laporan keuangan setiap tanggal 25 per bulan',
        'Laporan pajak dari konsultan per semester & collab analisa risiko',
        'Check assets & update assets dengan HRD tiap tahun',
        'Analisa cost center per 2 bulan'
      ]
    },
    {
      name: 'HR & MR',
      targetPct: 95.0,
      realizedPct: 94.0,
      targetStr: '95%',
      realizedStr: '94%',
      summary: 'Management Review, BCP/BCM, program pelatihan HRD 100%, serta perpanjangan Sertifikasi ISO TUV Rheinland sukses.',
      rgtRun: 'Tingkat keterlambatan karyawan dijaga maks 2% & ketidakhadiran maks 1%. Peningkatan koordinasi customer audit.',
      rgtGrow: 'Pengembangan talenta internal, pelaksanaan evaluasi KPI karyawan, & program CSR perusahaan.',
      rgtTransform: 'Implementasi HRIS terpadu untuk absensi, KPI, & audit mutu ISO.',
      kpiList: [
        'Program pelatihan terpenuhi 100%',
        'Persentase ketidakhadiran karyawan sebesar 1%',
        'Persentase keterlambatan karyawan sebesar 2%',
        'Internal Audit & perpanjangan sertifikasi ISO TUV Rheinland'
      ]
    }
  ];

  const years = [2025, 2026, 2027];
  let totalInserted = 0;

  for (const deptData of masterDepartments) {
    // 1. Pastikan Departemen ada
    const dept = await prisma.department.upsert({
      where: { name: deptData.name },
      update: { isActive: true },
      create: { name: deptData.name, isActive: true }
    });

    // 2. Masukkan Report untuk Tahun 2025, 2026, 2027
    for (const yr of years) {
      const currentRealized = yr === 2025 ? deptData.realizedPct - 1.5 : yr === 2027 ? Math.min(100, deptData.targetPct + 2) : deptData.realizedPct;

      const reportPayload = {
        year: yr,
        plantId: plant.id,
        departmentId: dept.id,
        status: 'APPROVED',
        achievementSummary: deptData.summary,
        metricsJson: JSON.stringify({
          targetPct: deptData.targetPct,
          realizedPct: currentRealized,
          target: deptData.targetStr,
          realized: deptData.realizedStr,
          status: "Verified",
          kpiList: deptData.kpiList
        }),
        rgtRun: deptData.rgtRun,
        rgtGrow: deptData.rgtGrow,
        rgtTransform: deptData.rgtTransform
      };

      await prisma.report.upsert({
        where: {
          year_plantId_departmentId: {
            year: yr,
            plantId: plant.id,
            departmentId: dept.id
          }
        },
        update: reportPayload,
        create: reportPayload
      });

      totalInserted++;
    }
  }

  console.log(`✅ BERHASIL! Total ${totalInserted} data laporan untuk ke-11 divisi berhasil dimasukkan ke database.`);
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });