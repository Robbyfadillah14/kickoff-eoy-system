
// backend/controllers/excelController.js — VERSI BARU
const fs = require("fs");
const { parseUploadedExcel } = require("../services/excelParser");
const prisma = require("../config/db"); // pakai koneksi bersama, jangan new PrismaClient() per file
 
const asObject = (m) => (m && typeof m === "object" && !Array.isArray(m) ? m : {});
 
async function handleExcelUpload(req, res) {
  const filePath = req.file?.path;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Tidak ada file Excel yang di-upload!" });
    }
 
    const parseResult = parseUploadedExcel(filePath);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error });
    }
 
    const { year, plantId, departmentId } = req.body;
    let saved = false;
 
    if (year && plantId && departmentId) {
      // Batasi: non-superadmin hanya boleh menulis ke plant miliknya (jika middleware auth mengisi req.user)
      const u = req.user;
      if (u && u.role !== "SUPER_ADMIN" && u.plantId && String(u.plantId) !== String(plantId)) {
        return res.status(403).json({ success: false, error: "Tidak punya akses ke plant ini" });
      }
 
      const report = await prisma.report.findUnique({
        where: { year_plantId_departmentId: { year: Number(year), plantId: String(plantId), departmentId: String(departmentId) } },
      });
      if (!report) {
        return res.status(404).json({ success: false, error: "Laporan untuk tahun/plant/departemen ini belum dibuat. Simpan laporan dulu, lalu upload." });
      }
      if (report.status === "LOCKED" || report.status === "APPROVED") {
        return res.status(409).json({ success: false, error: `Laporan berstatus ${report.status} dan tidak bisa diubah.` });
      }
 
      // MERGE — versi lama menimpa seluruh metricsJson sehingga semua isian laporan hilang
      await prisma.report.update({
        where: { id: report.id },
        data: {
          metricsJson: {
            ...asObject(report.metricsJson),
            lastUpload: {
              fileName: req.file.originalname,
              rows: parseResult.totalRows,
              parsedAt: new Date().toISOString(),
              sample: parseResult.data.slice(0, 5),
            },
          },
        },
      });
      saved = true;
    }
 
    return res.status(200).json({
      success: true,
      saved, // false = hanya preview, tidak ada yang disimpan ke laporan
      message: saved
        ? `Berhasil membaca ${parseResult.totalRows} baris dan mencatat ringkasannya di laporan.`
        : `Berhasil membaca ${parseResult.totalRows} baris (preview saja, belum disimpan ke laporan).`,
      totalRows: parseResult.totalRows,
      preview: parseResult.data.slice(0, 5),
    });
  } catch (error) {
    console.error("❌ Error di excelController:", error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    if (filePath) fs.unlink(filePath, () => {}); // file sementara tidak dibiarkan menumpuk di disk
  }
}
 
module.exports = { handleExcelUpload };
 