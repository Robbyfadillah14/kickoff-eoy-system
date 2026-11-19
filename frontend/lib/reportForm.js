import { resolveDepartment, formKeyOfDepartment } from "./presentation/registry.js";
import { OUTLOOK_KEYS } from "./presentation/kpi.js";

const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
const blank = (v) => v === undefined || v === null || String(v).trim() === "";

/** respons API -> array (mendukung array langsung, {data}, {reports}, {plants}, {departments}, objek tunggal) */
export function asList(d) {
  if (Array.isArray(d)) return d;
  for (const k of ["data", "reports", "plants", "departments", "list"]) if (Array.isArray(d?.[k])) return d[k];
  if (d?.data && typeof d.data === "object") return [d.data];
  return d && typeof d === "object" && d.id ? [d] : [];
}

/** form kosong bawaan */
export function blankForm() {
  return {
    salesType: "OMZET",
    achievementSummary: "",
    branchInnovations: "",
    challenges: [{ title: "" }],
    opportunities: [{ title: "" }],
    kpiList: [],
    salesPerformances: [{ id: 1, salesName: "", targetVal: "", actualVal: "", targetProfit: "", note: "", topProducts: [{ id: 1, productName: "", totalQty: "", category: "" }] }],
    salesSupportPerformances: [{ id: 1, supportName: "", taskDesc: "", statusOrAchieve: "", note: "" }],
    weeklyRevenue: ["", "", "", "", "", ""],
    targetAchievedPct: "",
  };
}

/**
 * `id` dan `year` disuntikkan ke form saat render (agar form anak bisa membaca form.year / form.id),
 * lalu ikut tersalin ketika form anak memanggil setForm({...form}). Selalu buang sebelum disimpan/dibandingkan.
 */
export const stripMeta = ({ id, year, ...rest } = {}) => rest;
export const snapshot = (f) => JSON.stringify(stripMeta(f));

/** baris tabel yang benar-benar diisi (baris kosong bawaan form tidak ikut disimpan) */
export const cleanRows = (list, keys) => (Array.isArray(list) ? list : []).filter((r) => keys.some((k) => !blank(r?.[k])));
export const cleanPerformances = (list) => cleanRows(list, ["salesName", "targetVal", "actualVal", "targetProfit", "note"]);
export const cleanSupport = (list) => cleanRows(list, ["supportName", "taskDesc", "statusOrAchieve", "note"]);
export const cleanTitles = (list) => (Array.isArray(list) ? list : []).filter((x) => !blank(x?.title));

const asObject = (m) => {
  if (m && typeof m === "object" && !Array.isArray(m)) return m;
  if (typeof m === "string") { try { const p = JSON.parse(m); return p && typeof p === "object" ? p : {}; } catch { return {}; } }
  return {};
};

/** laporan dari server -> state form (achievementSummary sengaja dikosongkan: itu ringkasan otomatis, dihitung ulang saat simpan) */
export function reportToForm(rep) {
  const base = blankForm();
  const m = asObject(rep?.metricsJson);
  const pick = (a, b, fallback) => (Array.isArray(a) && a.length ? a : Array.isArray(b) && b.length ? b : fallback);
  return {
    ...base,
    ...stripMeta(m),
    salesType: rep?.salesType || m.salesType || "OMZET",
    achievementSummary: "",
    branchInnovations: m.branchInnovations || rep?.branchInnovations || "",
    challenges: pick(rep?.challenges, m.challenges, base.challenges),
    opportunities: pick(rep?.opportunities, m.opportunities, base.opportunities),
    kpiList: pick(m.kpiList, null, base.kpiList),
    salesPerformances: pick(rep?.salesPerformances, m.salesPerformances, base.salesPerformances),
    salesSupportPerformances: pick(m.salesSupportPerformances, null, base.salesSupportPerformances),
    weeklyRevenue: pick(m.weeklyRevenue, null, base.weeklyRevenue),
    targetAchievedPct: m.targetAchievedPct || "",
  };
}

/**
 * Pilih SATU laporan dari respons API. Untuk pencarian (year/plant/dept) kandidat yang tidak cocok dibuang
 * (jaga-jaga bila server mengabaikan filter) -> tidak pernah memuat laporan tahun/divisi lain ke form.
 * Field yang tidak ada di respons dianggap cocok.
 */
export function pickReport(raw, want = {}) {
  const same = (a, b) => a == null || b == null || a === "" || b === "" || String(a) === String(b);
  const list = asList(raw).filter((r) =>
    same(r?.year, want.year) &&
    same(r?.plantId ?? r?.plant?.id, want.plantId) &&
    same(r?.departmentId ?? r?.department?.id, want.deptId));
  if (!list.length) return null;
  return [...list].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];
}

/** ringkasan otomatis dari isian pertama yang ada (untuk kolom achievementSummary) */
export const SUMMARY_KEYS = ["executiveSummary", "branchInnovations", "marketingEvaluation", "productDevEvaluation", ...OUTLOOK_KEYS];
export function buildSummary(form, deptName, year) {
  for (const k of SUMMARY_KEYS) if (typeof form?.[k] === "string" && form[k].trim()) return form[k].trim();
  return `Laporan ${deptName || "divisi"} tahun ${year} telah disimpan.`;
}

/** pemetaan lama (substring) — HANYA dipakai bila nama departemen belum ada di registry */
export function legacyFormKey(name) {
  const n = norm(name);
  if (!n) return null;
  if (/operational director|direktur operasional/.test(n)) return "OperationalDirectorForm";
  if (/operasional|operational/.test(n)) return "SalesForm";
  if (/sales|support/.test(n)) return "SalesForm";
  if (/finance ap/.test(n)) return "FinanceAPForm";
  if (/finance ar/.test(n)) return "FinanceARForm";
  if (/finance/.test(n)) return "FinanceDepartmentForm";
  if (/accounting|tax/.test(n)) return "AccountingTaxForm";
  if (/purchasing/.test(n)) return "PurchasingForm";
  if (/export|import|exim/.test(n)) return "EximForm";
  if (/(logistic|logistik)/.test(n) && /warehouse/.test(n)) return "LogisticWarehouseForm";
  if (/admin (logistic|logistik)/.test(n)) return "AdminLogisticForm";
  if (/admin tf|tukar faktur/.test(n)) return "AdminTfForm";
  if (/\bhr\b|\bmr\b|human resource/.test(n)) return "HrMrForm";
  if (/marketing/.test(n)) return "DigitalMarketingForm";
  if (/development/.test(n)) return "ProductDevelopmentForm";
  return null;
}
export const formKeyFor = (name) => (name ? formKeyOfDepartment(name) || legacyFormKey(name) : null);

/**
 * Divisi milik akun non-superadmin. Urutan: id -> nama divisi (registry) -> nama akun (registry) -> heuristik nama akun
 * (hanya bila tepat SATU divisi cocok). Tidak ada lagi fallback "divisi pertama di daftar" (itu menyimpan laporan ke divisi yang salah).
 */
export function pickUserDept(user, departments) {
  const list = Array.isArray(departments) ? departments : [];
  const ids = [user?.departmentId, user?.department?.id, user?.departments?.[0]?.departmentId, typeof user?.departments?.[0] === "string" ? user.departments[0] : null].filter(Boolean).map(String);
  for (const id of ids) { const d = list.find((x) => String(x.id) === id); if (d) return d; }

  const names = [user?.departmentName, user?.department?.name, typeof user?.department === "string" ? user.department : null, user?.name].filter(Boolean);
  for (const n of names) {
    const reg = resolveDepartment(n);
    const d = reg && list.find((x) => norm(x.name) === norm(reg.name));
    if (d) return d;
  }

  const acct = norm(user?.name);
  const rules = [[/finance/, /finance/], [/purchasing/, /purchasing/], [/accounting|\btax\b/, /accounting|\btax\b/], [/\bhr\b|\bmr\b/, /\bhr\b|\bmr\b/], [/exim/, /exim|export/]];
  for (const [a, d] of rules) {
    if (!a.test(acct)) continue;
    const hits = list.filter((x) => d.test(norm(x.name)));
    if (hits.length === 1) return hits[0];
  }
  return null;
}