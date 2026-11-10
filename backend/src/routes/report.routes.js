const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const XLSX = require("xlsx");
const prisma = require("../config/db");
const ctrl = require("../controllers/reportController");
const exportCtrl = require("../controllers/exportController");
const { authenticate, requireRole } = require("../middleware/auth");

// Import Intelligence Engine dengan path yang benar (mundur 2 folder ke backend/services)
let analyzePerformanceMetrics;
try {
  const intelService = require("../../services/intelligenceEngine");
  analyzePerformanceMetrics = intelService.analyzePerformanceMetrics;
} catch (e) {
  console.warn("⚠️ Warning: intelligenceEngine tidak ditemukan di ../../services/, menggunakan fallback.");
  analyzePerformanceMetrics = () => ({
    summary: { executiveSummary: "Analisis otomatis belum aktif." },
    anomalies: [],
    strengths: []
  });
}

const upload = multer({ dest: path.join(__dirname, "../../uploads") });

router.get("/", authenticate, ctrl.list);
router.get("/export", authenticate, requireRole("DEPARTMENT_MANAGER", "SUPER_ADMIN"), exportCtrl.exportReports);

// ROUTE POST HARUS DI ATAS SEBELUM ROUTE PARAMETER (/:id)
router.post("/", authenticate, requireRole("DEPARTMENT_CONTRIBUTOR", "DEPARTMENT_MANAGER", "SUPER_ADMIN"), ctrl.upsert);

// ROUTE GET DETAIL LAPORAN BERDASARKAN ID
router.get("/:id", authenticate, ctrl.getById);

router.patch("/:id/review", authenticate, requireRole("DEPARTMENT_MANAGER", "SUPER_ADMIN"), ctrl.reviewStatus);
router.post("/lock-expired", authenticate, requireRole("SUPER_ADMIN"), ctrl.lockExpired);

router.delete("/:id", authenticate, requireRole("DEPARTMENT_CONTRIBUTOR", "DEPARTMENT_MANAGER", "SUPER_ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.attachment.deleteMany({ where: { reportId: String(id) } }).catch(() => {});
    await prisma.report.delete({ where: { id: String(id) } });
    return res.status(200).json({ message: "Laporan berhasil dihapus" });
  } catch (error) {
    console.error("Gagal menghapus laporan:", error);
    return res.status(500).json({ error: error.message || "Gagal menghapus laporan dari database" });
  }
});

// ROUTE UPLOAD ATTACHMENT + SMART EXCEL PARSER AUTOMATION (MULTI-YEAR 2024-2027) + INTELLIGENCE ENGINE
router.post("/:id/attachments", authenticate, upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "File tidak ditemukan" });
    }

    // 1. Simpan attachment record ke database
    const att = await prisma.attachment.create({
      data: {
        reportId: id,
        fileName: req.file.originalname,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
      },
    });

    // 2. SMART PARSER ENGINE: Deteksi file Excel (.xlsx / .xls)
    const isExcel =
      (req.file.mimetype && req.file.mimetype.includes("spreadsheet")) ||
      req.file.originalname.endsWith(".xlsx") ||
      req.file.originalname.endsWith(".xls");

    if (isExcel) {
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      // Ambil metadata laporan acuan (untuk plantId & departmentId)
      const baseReport = await prisma.report.findUnique({ where: { id: String(id) } });

      // Wadah pengelompokan data berdasarkan Tahun (2024, 2025, 2026, 2027)
      const rowsByYear = {};

      rawData.forEach((row) => {
        const findVal = (keywords) => {
          const foundKey = Object.keys(row).find((k) =>
            keywords.some((kw) => k.toLowerCase().includes(kw))
          );
          return foundKey ? row[foundKey] : null;
        };

        // Deteksi kolom tahun di Excel secara fleksibel (year, tahun, periode, thn)
        const rawYear = findVal(["year", "tahun", "periode", "thn"]);
        let rowYear = Number(rawYear);
        
        // Jika tidak ada kolom tahun di Excel, pakai tahun dari laporan aktif
        if (!rowYear || isNaN(rowYear) || rowYear < 2024 || rowYear > 2027) {
          rowYear = Number(baseReport?.year || 2026);
        }

        const rawTarget = findVal(["target", "plan", "anggaran", "budget", "req"]);
        const rawActual = findVal(["aktual", "realisasi", "omzet", "profit", "actual", "capaian"]);

        const targetVal = Number(String(rawTarget || 0).replace(/[^0-9.-]+/g, "")) || 0;
        const actualVal = Number(String(rawActual || 0).replace(/[^0-9.-]+/g, "")) || 0;

        const parsedItem = {
          salesName: String(
            findVal(["nama", "sales", "person", "petugas", "item", "bulan", "divisi", "description", "keterangan"]) || "Sales/Item"
          ).trim(),
          targetVal,
          actualVal,
          targetProfit: targetVal,
          note: String(findVal(["note", "remaks", "keterangan", "status", "kendala", "slogan"]) || "").trim(),
          rawRow: row
        };

        if (!rowsByYear[rowYear]) {
          rowsByYear[rowYear] = [];
        }
        rowsByYear[rowYear].push(parsedItem);
      });

      // 3. SINKRONISASI OTONOM + INTELLIGENCE ENGINE: Distribusikan per tahun ke database
      for (const [yr, items] of Object.entries(rowsByYear)) {
        const targetYearNum = Number(yr);

        // Jalankan Analisis Otomatis (Anomaly & Executive Summary Generator)
        const intelligenceResult = analyzePerformanceMetrics(items);

        // Cari apakah laporan untuk (plantId + departmentId + year) ini sudah ada
        let targetReport = await prisma.report.findFirst({
          where: {
            plantId: baseReport?.plantId,
            departmentId: baseReport?.departmentId,
            year: targetYearNum,
          },
        });

        // Jika belum ada laporan di tahun tersebut, buat otomatis!
        if (!targetReport) {
          targetReport = await prisma.report.create({
            data: {
              year: targetYearNum,
              plantId: baseReport?.plantId,
              departmentId: baseReport?.departmentId,
              createdById: baseReport?.createdById,
              achievementSummary: intelligenceResult?.summary?.executiveSummary || "Laporan dibuat otomatis",
              metricsJson: {},
            },
          });
        }

        const currentMetrics = (targetReport?.metricsJson && typeof targetReport.metricsJson === "object") 
          ? targetReport.metricsJson 
          : {};

        // Update laporan tahun terkait dengan hasil analisis cerdas
        await prisma.report.update({
          where: { id: targetReport.id },
          data: {
            achievementSummary: intelligenceResult?.summary?.executiveSummary || targetReport.achievementSummary,
            metricsJson: {
              ...currentMetrics,
              salesType: currentMetrics.salesType || "OMZET",
              salesPerformances: items,
              intelligenceAnalysis: intelligenceResult, // Menyimpan deteksi anomali & saran preskriptif
              sourceFileName: req.file.originalname,
              parsedAt: new Date().toISOString(),
            },
          },
        });
      }
    }

    return res.status(201).json({
      attachment: att,
      message: isExcel
        ? "File Excel berhasil diparse, dianalisis secara cerdas, dan dipetakan ke tahun 2024–2027!"
        : "File lampiran berhasil di-upload.",
    });
  } catch (error) {
    console.error("Gagal memproses upload attachment & Excel parser:", error);
    return res.status(500).json({ error: error.message || "Gagal meng-upload file attachment" });
  }
});

module.exports = router;