const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const prisma = require("../config/db");

async function fetchReports({ year, plantId, departmentId }) {
  const where = {};
  if (year) where.year = Number(year);
  if (plantId) where.plantId = plantId;
  if (departmentId) where.departmentId = departmentId;
  return prisma.report.findMany({ where, include: { plant: true, department: true }, orderBy: [{ plantId: "asc" }, { departmentId: "asc" }] });
}

// GET /api/reports/export?year=&plantId=&departmentId=&format=xlsx|pdf
// Export laporan bisa per-departemen, per-plant, atau seluruh holding sekaligus (filter kombinasi)
async function exportReports(req, res) {
  const { year, plantId, departmentId, format } = req.query;
  const reports = await fetchReports({ year, plantId, departmentId });

  if (format === "pdf") return exportPdf(reports, res, { year, plantId, departmentId });
  return exportXlsx(reports, res, { year, plantId, departmentId });
}

async function exportXlsx(reports, res, filters) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Ekasurya Group — Kickoff & EOY Reporting";
  const sheet = wb.addWorksheet(`Laporan ${filters.year || "Semua Tahun"}`);

  sheet.columns = [
    { header: "Plant", key: "plant", width: 22 },
    { header: "Departemen", key: "dept", width: 18 },
    { header: "Tahun", key: "year", width: 8 },
    { header: "Status", key: "status", width: 16 },
    { header: "% Target", key: "target", width: 10 },
    { header: "ARPU", key: "arpu", width: 12 },
    { header: "CLV", key: "clv", width: 12 },
    { header: "CAC", key: "cac", width: 12 },
    { header: "Ringkasan Achievement", key: "summary", width: 40 },
    { header: "RUN 2027", key: "run", width: 30 },
    { header: "GROW 2027", key: "grow", width: 30 },
    { header: "TRANSFORM 2027", key: "transform", width: 30 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F1A2E" } };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  reports.forEach((r) => {
    const m = r.metricsJson || {};
    sheet.addRow({
      plant: r.plant?.name, dept: r.department?.name, year: r.year, status: r.status,
      target: m.targetAchievedPct || "-", arpu: m.arpu || "-", clv: m.clv || "-", cac: m.cac || "-",
      summary: r.achievementSummary || "-", run: r.rgtRun || "-", grow: r.rgtGrow || "-", transform: r.rgtTransform || "-",
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="laporan-${filters.year || "all"}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}

function exportPdf(reports, res, filters) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="laporan-${filters.year || "all"}.pdf"`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).fillColor("#0f1a2e").text("Ekasurya Group", { continued: false });
  doc.fontSize(12).fillColor("#555").text("Corporate Kickoff & End-of-Year Reporting");
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Tahun: ${filters.year || "Semua"}  |  Digenerate: ${new Date().toLocaleString("id-ID")}`);
  doc.moveDown();

  reports.forEach((r, i) => {
    const m = r.metricsJson || {};
    doc.fontSize(13).fillColor("#0f1a2e").text(`${i + 1}. ${r.department?.name} — ${r.plant?.name}`, { underline: true });
    doc.fontSize(10).fillColor("#000")
      .text(`Status: ${r.status}   |   % Target: ${m.targetAchievedPct || "-"}   |   ARPU: ${m.arpu || "-"}   CLV: ${m.clv || "-"}   CAC: ${m.cac || "-"}`);
    doc.moveDown(0.3);
    doc.text(`Ringkasan Achievement: ${r.achievementSummary || "-"}`);
    doc.moveDown(0.3);
    doc.text(`RUN 2027: ${r.rgtRun || "-"}`);
    doc.text(`GROW 2027: ${r.rgtGrow || "-"}`);
    doc.text(`TRANSFORM 2027: ${r.rgtTransform || "-"}`);
    doc.moveDown();
    if (i < reports.length - 1) doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#ddd").stroke();
    doc.moveDown();
  });

  if (!reports.length) doc.fontSize(11).text("Tidak ada data laporan untuk filter ini.");
  doc.end();
}

module.exports = { exportReports };
