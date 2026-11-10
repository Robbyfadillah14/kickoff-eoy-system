const { parseUploadedExcel } = require("../services/excelParser");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function handleExcelUpload(req, res) {
  try {
    // 1. Cek apakah file ada di request (biasanya pakai multer)
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Tidak ada file Excel yang di-upload!" });
    }

    const filePath = req.file.path;
    console.log(`📂 Memproses file upload di path: ${filePath}`);

    // 2. Panggil service parser Excel yang sudah kita buat
    const parseResult = parseUploadedExcel(filePath);

    if (!parseResult.success) {
      return res.status(400).json({ success: false, error: parseResult.error });
    }

    // 3. Simpan metadata attachment atau ringkasan data ke database (opsional sesuai kebutuhan)
    // Contoh menyimpan log attachment ke tabel Report atau sejenisnya
    const { year, plantId, departmentId } = req.body;

    if (year && plantId && departmentId) {
      await prisma.report.updateMany({
        where: {
          year: Number(year),
          plantId: String(plantId),
          departmentId: String(departmentId),
        },
        data: {
          metricsJson: {
            uploadedRowsCount: parseResult.totalRows,
            lastFileName: req.file.originalname,
            parsedDataSample: parseResult.data.slice(0, 5), // Simpan sampel 5 baris pertama
          }
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: `Berhasil memproses ${parseResult.totalRows} baris data Excel secara otonom!`,
      totalRows: parseResult.totalRows,
      preview: parseResult.data.slice(0, 5), // Kirim preview ke frontend
    });

  } catch (error) {
    console.error("❌ Error di excelController:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { handleExcelUpload };