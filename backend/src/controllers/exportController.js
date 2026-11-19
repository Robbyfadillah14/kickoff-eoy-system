// backend/controllers/exportController.js — VERSI BARU
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const prisma = require("../config/db");

const PHASE = { 2024: "Run", 2025: "Grow", 2026: "Transform", 2027: "Future" };
const asObject = (m) => (m && typeof m === "object" && !Array.isArray(m) ? m : {});
const dash = (v) => (v === undefined || v === null || v === "" ? "-" : v); // angka 0 tetap tampil
const titles = (v) =>
  (Array.isArray(v) ? v : v ? [v] : []).map((x) => (typeof x === "string" ? x : x?.title || x?.text || "")).filter(Boolean).join("; ") || "-";

async function fetchReports({ year, plantId, departmentId }, user) {
  const where = {};
  if (year) where.year = Number(year);
  if (departmentId) where.departmentId = departmentId;
  // non-superadmin hanya boleh mengekspor plant miliknya (jika middleware auth mengisi req.user)
  if (user && user.role !== "SUPER_ADMIN" && user.plantId) where.plantId = user.plantId;
  else if (plantId) where.plantId = plantId;
  return prisma.report.findMany({
    where,
    include: { plant: true, department: true },
    orderBy: [{ year: "asc" }, { plantId: "asc" }, { departmentId: "asc" }],
  });
}

// GET /api/reports/export?year=&plantId=&departmentId=&format=xlsx|pdf
async function exportReports(req, res) {
  try {
    const { year, plantId, departmentId, format } = req.query;
    const reports = await fetchReports({ year, plantId, departmentId }, req.user);
    const filters = { year, plantId, departmentId };
    if (format === "pdf") return exportPdf(reports, res, filters);
    return await exportXlsx(reports, res, filters);
  } catch (error) {
    console.error("Gagal export laporan:", error);
    if (!res.headersSent) return res.status(500).json({ error: error.message || "Gagal export laporan" });
    res.end();
  }
}

async function exportXlsx(reports, res, filters) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Ekasurya Group — Kickoff & EOY Reporting";
  const sheet = wb.addWorksheet(`Laporan ${filters.year || "Semua Tahun"}`);

  sheet.columns = [
    { header: "Plant", key: "plant", width: 22 },
    { header: "Departemen", key: "dept", width: 22 },
    { header: "Tahun", key: "year", width: 8 },
    { header: "Fase", key: "phase", width: 11 },
    { header: "Status", key: "status", width: 18 },
    { header: "% Target", key: "target", width: 10 },
    { header: "ARPU", key: "arpu", width: 14 },
    { header: "CLV", key: "clv", width: 14 },
    { header: "CAC", key: "cac", width: 14 },
    { header: "Ringkasan Achievement", key: "summary", width: 44 },
    { header: "Run", key: "run", width: 30 },
    { header: "Grow", key: "grow", width: 30 },
    { header: "Transform", key: "transform", width: 30 },
    { header: "Tantangan", key: "challenges", width: 34 },
    { header: "Peluang", key: "opportunities", width: 34 },
  ];
  const head = sheet.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F1A2E" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  reports.forEach((r) => {
    const m = asObject(r.metricsJson);
    sheet.addRow({
      plant: r.plant?.name, dept: r.department?.name, year: r.year, phase: PHASE[r.year] || "-", status: r.status,
      target: dash(m.targetAchievedPct), arpu: dash(m.arpu), clv: dash(m.clv), cac: dash(m.cac),
      summary: dash(r.achievementSummary), run: dash(r.rgtRun), grow: dash(r.rgtGrow), transform: dash(r.rgtTransform),
      challenges: titles(r.challenges), opportunities: titles(r.opportunities),
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

  doc.fontSize(18).fillColor("#0f1a2e").text("Ekasurya Group");
  doc.fontSize(12).fillColor("#555").text("Corporate Kickoff & End-of-Year Reporting");
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Tahun: ${filters.year || "Semua"}  |  Digenerate: ${new Date().toLocaleString("id-ID")}`);
  doc.moveDown();

  reports.forEach((r, i) => {
    const m = asObject(r.metricsJson);
    if (doc.y > 680) doc.addPage();
    doc.fontSize(13).fillColor("#0f1a2e").text(`${i + 1}. ${r.department?.name} — ${r.plant?.name} (${r.year} · ${PHASE[r.year] || "-"})`, { underline: true });
    doc.fontSize(10).fillColor("#000")
      .text(`Status: ${r.status}   |   % Target: ${dash(m.targetAchievedPct)}   |   ARPU: ${dash(m.arpu)}   CLV: ${dash(m.clv)}   CAC: ${dash(m.cac)}`);
    doc.moveDown(0.3);
    doc.text(`Ringkasan Achievement: ${dash(r.achievementSummary)}`);
    doc.moveDown(0.3);
    doc.text(`Run: ${dash(r.rgtRun)}`);
    doc.text(`Grow: ${dash(r.rgtGrow)}`);
    doc.text(`Transform: ${dash(r.rgtTransform)}`);
    doc.text(`Tantangan: ${titles(r.challenges)}`);
    doc.text(`Peluang: ${titles(r.opportunities)}`);
    doc.moveDown();
    if (i < reports.length - 1) doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#ddd").stroke();
    doc.moveDown();
  });

  if (!reports.length) doc.fontSize(11).text("Tidak ada data laporan untuk filter ini.");
  doc.end();
}

module.exports = { exportReports };