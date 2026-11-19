import { isEmptyValue } from "./numbers.js";

/**
 * Penilaian KPI untuk departemen yang mengisi form berupa TEKS BEBAS
 * ("Realisasi 96% (maksimal telat 5 invoice/bulan)", "Tercapai sampai Juni 2025", dst).
 *
 * Aturan (sengaja konservatif — tidak menebak):
 *  - kind "pct"   : ambil persentase dari teks. Ada target -> tercapai/tidak ditentukan dari angka & arah (min/max).
 *                   Tidak ada angka % di teks -> jatuh ke penilaian kata (lihat "text").
 *  - kind "count" : ambil angka (utamakan yang mengikuti kata "realisasi"). Bandingkan dengan target & arah.
 *  - kind "text"  : kata negatif (belum/gagal/terkendala/telat/tidak tercapai) -> belum; kata positif (tercapai/tepat waktu/sesuai/...) -> tercapai;
 *                   selain itu hanya informasi (met = null, tidak ikut skor).
 *  - kind "info"  : selalu informasi (mis. total DO, jadwal STO).
 */

export const DEPT_KPIS = {
  DIG_MKT: {
    evaluationKey: "marketingEvaluation",
    kpis: [
      { key: "leadGenAch",        label: "Lead generation & conversion rate", kind: "text" },
      { key: "socialMediaGrowth", label: "Social media growth & engagement",  kind: "text" },
    ],
  },
  PROD_DEV: {
    evaluationKey: "productDevEvaluation",
    kpis: [
      { key: "newProductLaunch", label: "Riset & launching produk baru",       kind: "text" },
      { key: "sampleTesting",    label: "Pengujian sampel & kepatuhan standar", kind: "text" },
    ],
  },
  FIN_DEPT: {
    evaluationKey: "financeDeptEvaluation",
    kpis: [
      { key: "danaCadangan",     label: "Alokasi dana cadangan (10% net profit)", kind: "text" },
      { key: "budgetReportDate", label: "Reporting budget hutang & piutang",      kind: "text" },
      { key: "salesReportDate",  label: "Reporting sales bulanan ke manajemen",   kind: "text" },
    ],
  },
  FIN_AR: {
    evaluationKey: null,
    kpis: [
      { key: "arIdrAch",       label: "Pencapaian piutang IDR", kind: "pct", target: 98, dir: "min", targetLabel: "≥ 98%" },
      { key: "arUsdAch",       label: "Pencapaian piutang USD", kind: "pct", target: 98, dir: "min", targetLabel: "≥ 98%" },
      { key: "badDebtControl", label: "Mitigasi & kontrol bad debt", kind: "text" },
    ],
  },
  FIN_AP: {
    evaluationKey: "apEvaluation",
    kpis: [
      { key: "monthlyReportDate", label: "Pengiriman monthly report",        kind: "text" },
      { key: "budgetHutangAch",   label: "Budget hutang bulanan",            kind: "pct", target: 100, dir: "min", targetLabel: "100%" },
      { key: "claimSpaAch",       label: "Claim SPA (KCID & KCTM) maks tgl 15", kind: "text" },
      { key: "sapUpdateAch",      label: "Update kartu hutang & petty cash SAP", kind: "text" },
    ],
  },
  // Form Accounting & Tax dipakai bersama oleh dept "Accounting" dan "Tax"
  ACCT: null, TAX: null, // diisi di bawah
  ADM_TF: {
    evaluationKey: "adminTfEvaluation",
    kpis: [
      { key: "tfLuarKotaAch",       label: "Tagihan luar kota",            kind: "pct", target: 98, dir: "min", targetLabel: "≥ 98%" },
      { key: "tfEmailSistemAch",    label: "Invoice by email & sistem",    kind: "pct", target: 99, dir: "min", targetLabel: "≥ 99%" },
      { key: "totalInvLuarKota",    label: "Total invoice luar kota",      kind: "info" },
      { key: "totalInvEmailSistem", label: "Total invoice email & sistem", kind: "info" },
    ],
  },
  PURCH: {
    evaluationKey: "purchasingEvaluation",
    kpis: [
      { key: "topSupplier30d", label: "Top supplier 30 hari (min 2 supplier)", kind: "count", target: 2, dir: "min", targetLabel: "≥ 2 supplier" },
      { key: "supplierOtd",    label: "Supplier on-time delivery",       kind: "pct", target: 98, dir: "min", targetLabel: "≥ 98%" },
      { key: "newSupplierDev", label: "Sourcing supplier baru (min 2)",  kind: "count", target: 2, dir: "min", targetLabel: "≥ 2 supplier" },
      { key: "updateLc",       label: "Update landing cost (maks 1 hari)", kind: "text", targetLabel: "maks 1 hari" },
      { key: "stoSchedule",    label: "STO 4× per tahun",                kind: "info", targetLabel: "4×/tahun" },
    ],
  },
  EXIM: {
    evaluationKey: "eximEvaluation",
    kpis: [
      { key: "ipakCdakb",         label: "IPAK & sertifikasi CDAKB",              kind: "text" },
      { key: "pabeanCompliance",  label: "Kepatuhan dokumen pabean",              kind: "text" },
      { key: "importQuotaStatus", label: "Realisasi & pengajuan kuota import",    kind: "text" },
      { key: "gbCustomerTarget",  label: "Customer gudang berikat baru (min 10)", kind: "text" },
    ],
  },
  LOG_WH: {
    evaluationKey: "logisticEvaluation",
    kpis: [
      { key: "logisticOtd",        label: "On-time delivery",        kind: "pct", target: 99, dir: "min", targetLabel: "≥ 99%" },
      { key: "logisticError",      label: "Error delivery",          kind: "pct", target: 0,  dir: "max", targetLabel: "0%" },
      { key: "totalDo",            label: "Total DO",                kind: "info" },
      { key: "warehouseStockCtrl", label: "Pengelolaan stock & rework", kind: "text" },
      { key: "urgentDeliveryNote", label: "Mitigasi urgent delivery",   kind: "info" },
    ],
  },
  ADM_LOG: {
    evaluationKey: "cancelInvAnalysis",
    kpis: [
      { key: "poSoftcopyArch",  label: "Arsip PO softcopy",            kind: "text" },
      { key: "csSupportStatus", label: "Customer service support",     kind: "info" },
      { key: "totalDoInvCreated", label: "Total DO & invoice terbit",  kind: "info" },
      { key: "cancelInvTarget", label: "Cancel invoice (maks 150 dokumen)", kind: "count", target: 150, dir: "max", targetLabel: "≤ 150" },
    ],
  },
  HR_MR: {
    evaluationKey: "hrEvaluation",
    kpis: [
      { key: "manpowerAch",     label: "Pemenuhan manpower",     kind: "pct", target: 100, dir: "min", targetLabel: "100%" },
      { key: "turnoverRate",    label: "Turnover karyawan",      kind: "pct", target: 2,   dir: "max", targetLabel: "≤ 2%" },
      { key: "absenteeismRate", label: "Absenteeism",            kind: "pct", target: 1,   dir: "max", targetLabel: "≤ 1%" },
      { key: "lateRate",        label: "Keterlambatan",          kind: "pct", target: 2,   dir: "max", targetLabel: "≤ 2%" },
      { key: "trainingAch",     label: "Realisasi training tahunan", kind: "pct" },
      { key: "isoStatus",       label: "Status sertifikasi ISO", kind: "info" },
      { key: "internalAudit",   label: "Audit internal & review SOP", kind: "text" },
    ],
  },
};
DEPT_KPIS.ACCT = DEPT_KPIS.TAX = {
  evaluationKey: "taxEvaluation",
  kpis: [
    { key: "lapKeuanganDate",   label: "Laporan keuangan bulanan (maks tgl 25)", kind: "text" },
    { key: "taxConsultantReport", label: "Laporan pajak konsultan / semester",   kind: "text" },
    { key: "costCenterAnalysis", label: "Analisa cost center / 2 bulan",         kind: "text" },
    { key: "assetUpdate",       label: "Check & update asset dengan HRD",        kind: "text" },
    { key: "taxRevisi",         label: "Faktur pajak revisi", kind: "pct", target: 2, dir: "max", targetLabel: "≤ 2%" },
    { key: "taxBatal",          label: "Faktur pajak batal",  kind: "pct", target: 1, dir: "max", targetLabel: "≤ 1%" },
  ],
};

/** seluruh key evaluasi/outlook yang mungkin berisi arah 2027 (urutan = prioritas) */
export const OUTLOOK_KEYS = [
  "strategicOutlook2027", "nextYearOutlook",
  ...new Set(Object.values(DEPT_KPIS).map((d) => d.evaluationKey).filter(Boolean)),
  "generalNotes",
];

const num = (s) => { const n = Number(String(s).replace(",", ".")); return Number.isFinite(n) ? n : null; };

/** "Realisasi 96% (maks telat 5 invoice)" -> 96 ; "Tercapai 98,5%" -> 98.5 ; tanpa % -> null */
export function pctFromText(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v ?? "");
  const kw = s.match(/(?:realisasi|aktual|actual|ach|tercapai|capai\w*)\D{0,14}?(\d+(?:[.,]\d+)?)\s*%/i);
  if (kw) return num(kw[1]);
  const any = s.match(/(\d+(?:[.,]\d+)?)\s*%/);
  return any ? num(any[1]) : null;
}

/** angka biasa (mis. dokumen): utamakan yang mengikuti kata "realisasi" */
export function countFromText(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v ?? "");
  const kw = s.match(/(?:realisasi|aktual|actual)\D{0,14}?(\d+(?:[.,]\d+)?)/i);
  const m = kw || s.match(/(\d+(?:[.,]\d+)?)/);
  return m ? num(m[1]) : null;
}

const NEG = /\b(belum|gagal|terkendala|terlambat|telat|tidak\s+(?:tercapai|terpenuhi|sesuai)|tak\s+tercapai)\b/i;
const POS = /\b(tercapai|tepat\s+waktu|sesuai|selesai|terpenuhi|terbit|lengkap|rutin|closed|lolos)\b/i;
const verdictFromWords = (s) => (NEG.test(s) ? false : POS.test(s) ? true : null);

const clip = (s, n) => { const t = String(s).replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t; };
const fmtNum = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""));

/**
 * Nilai satu sel KPI.
 * @returns null (kosong) | { raw, value, met: true|false|null, display }
 */
export function judgeKpi(spec, raw) {
  if (isEmptyValue(raw)) return null;
  const text = String(raw).trim();
  let value = null, met = null, display = clip(text, 46);

  if (spec.kind === "pct") {
    value = pctFromText(text);
    if (value != null) {
      display = `${fmtNum(value)}%`;
      if (spec.target != null) met = spec.dir === "max" ? value <= spec.target : value >= spec.target;
    } else met = verdictFromWords(text);
  } else if (spec.kind === "count") {
    value = countFromText(text);
    if (value != null) {
      display = `${fmtNum(value)}`;
      if (spec.target != null) met = spec.dir === "max" ? value <= spec.target : value >= spec.target;
    } else met = verdictFromWords(text);
  } else if (spec.kind === "text") {
    met = verdictFromWords(text);
  }
  return { raw: text, value, met, display };
}

/**
 * Matriks KPI satu departemen x 4 tahun.
 * @returns { rows:[{ key,label,targetLabel,kind, cells:{2024:judged|null,...} }], hasData }
 */
export function kpiMatrix(data, deptCode, years = [2024, 2025, 2026, 2027]) {
  const spec = DEPT_KPIS[deptCode];
  if (!spec) return { rows: [], hasData: false };
  let hasData = false;
  const rows = spec.kpis.map((k) => {
    const cells = {};
    for (const y of years) {
      const m = data?.years?.[y]?.byDept?.[deptCode]?.metrics;
      cells[y] = m ? judgeKpi(k, m[k.key]) : null;
      if (cells[y]) hasData = true;
    }
    return { key: k.key, label: k.label, targetLabel: k.targetLabel || "", kind: k.kind, cells };
  });
  return { rows, hasData };
}

/** skor satu tahun: tercapai / (tercapai + belum) dari semua KPI ber-verdict di dept yang diminta */
export function scoreOf(data, deptCodes, year) {
  let ok = 0, bad = 0;
  for (const code of deptCodes) {
    const { rows } = kpiMatrix(data, code, [year]);
    for (const r of rows) {
      const c = r.cells[year];
      if (!c || c.met == null) continue;
      c.met ? ok++ : bad++;
    }
  }
  const total = ok + bad;
  return { ok, bad, total, pct: total ? (ok / total) * 100 : null };
}

/** baris tabel target-aktual dari upload Excel (salesPerformances) — baris kosong bawaan form dibuang */
export function excelItems(metrics) {
  const list = Array.isArray(metrics?.salesPerformances) ? metrics.salesPerformances : [];
  return list
    .filter((p) => !isEmptyValue(p?.salesName) || !isEmptyValue(p?.targetVal) || !isEmptyValue(p?.actualVal))
    .map((p) => ({ name: String(p.salesName || "—").trim(), target: p.targetVal, actual: p.actualVal, note: p.note || "" }));
}

export { clip };