const XLSX = require("xlsx");

/**
 * Fungsi otonom untuk membaca file Excel yang di-upload
 * dan mengubahnya menjadi format JSON siap simpan ke Database.
 */
function parseUploadedExcel(filePath) {
  try {
    // 1. Baca workbook dari path file yang di-upload
    const workbook = XLSX.readFile(filePath);
    
    // 2. Ambil nama sheet pertama
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // 3. Konversi isi sheet ke dalam bentuk JSON (array of objects)
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Berhasil membaca ${rawData.length} baris data dari sheet: ${sheetName}`);

    // 4. Mapping atau pemetaan data mentah agar sesuai dengan skema database
    const cleanedData = rawData.map((row, index) => ({
      rowNumber: index + 1,
      siteName: row["Site Name"] || row["Cabang"] || "Unknown Site",
      date: row["Date"] || row["Tanggal"] || new Date(),
      itemName: row["Item Name"] || row["Nama Barang"] || "General Item",
      quantity: Number(row["Quantity"] || row["Qty"] || 1),
      totalSales: Number(row["Total Sales Incl PPN"] || row["Total Sales"] || 0),
    }));

    return {
      success: true,
      totalRows: cleanedData.length,
      data: cleanedData,
    };
  } catch (error) {
    console.error("❌ Gagal memparsing file Excel:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { parseUploadedExcel };