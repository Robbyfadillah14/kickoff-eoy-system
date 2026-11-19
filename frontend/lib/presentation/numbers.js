/* Util angka & teks untuk presentasi. Semua fungsi aman terhadap input kotor (tidak pernah NaN). */

export const hasVal = (v) => v !== undefined && v !== null && String(v).trim() !== "";

const IGNORED_KEYS = new Set(["id", "_id"]);

/** true bila nilai tidak berisi apa pun yang berarti (deep). Angka 0 dan false dianggap terisi. */
export function isEmptyValue(v) {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (typeof v === "number") return !Number.isFinite(v);
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return v.every(isEmptyValue);
  if (typeof v === "object") {
    return Object.entries(v).every(([k, x]) => IGNORED_KEYS.has(k) || isEmptyValue(x));
  }
  return false;
}

const NUM_TOKEN = /-?\d(?:[\d.,]*\d)?/;

/* Format Indonesia: titik = ribuan, koma = desimal. Asumsi sengaja untuk Rupiah. */
function normalizeToken(tok) {
  let s = tok;
  let neg = false;
  if (s.startsWith("-")) { neg = true; s = s.slice(1); }
  const dots = (s.match(/\./g) || []).length;
  const commas = (s.match(/,/g) || []).length;

  if (dots && commas) {
    // pemisah yang muncul paling akhir = desimal
    const dec = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    const thou = dec === "," ? "." : ",";
    s = s.split(thou).join("").replace(dec, ".");
  } else if (commas) {
    s = commas > 1 ? s.split(",").join("") : s.replace(",", ".");   // "1,5" -> 1.5 ; "1,250,000" -> 1250000
  } else if (dots) {
    if (dots > 1 || (/^[1-9]\d{0,2}\.\d{3}$/.test(s))) s = s.split(".").join(""); // "1.250.000" / "12.000" -> ribuan
    // selain itu desimal: "98.5", "113.63", "0.500"
  }
  const n = Number(s);
  return Number.isFinite(n) ? (neg ? -n : n) : NaN;
}

/** Angka pertama yang ditemukan di teks. "Rp 1.250.000" -> 1250000, "98,5%" -> 98.5, "abc" -> 0 */
export function toNum(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const m = String(v ?? "").match(NUM_TOKEN);
  if (!m) return 0;
  const n = normalizeToken(m[0]);
  return Number.isFinite(n) ? n : 0;
}

/** Persentase dari teks bebas: utamakan angka yang menempel di "%" . "Tercapai 98.5% (target 98%)" -> 98.5 */
export function toPct(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v ?? "");
  const m = s.match(/(-?\d(?:[\d.,]*\d)?)\s*%/);
  return m ? toNum(m[1]) : toNum(s);
}

/** Tanggal (1-31) dari teks bebas. "tgl 05" -> 5, "Juni 2025" -> null, "100%" -> null */
export function parseDay(v) {
  if (typeof v === "number") return Number.isInteger(v) && v >= 1 && v <= 31 ? v : null;
  const s = String(v ?? "");
  let m = s.match(/\b(?:tgl|tanggal)\.?\s*(\d{1,2})(?!\d)/i);
  if (!m) m = s.match(/(?:^|[^\d.,])(\d{1,2})(?![\d.,%]|\s*(?:hari|kali|jam|menit|bulan|minggu)\b)/i);
  const n = m ? Number(m[1]) : NaN;
  return n >= 1 && n <= 31 ? n : null;
}

export const isNumericOnly = (v) => /^\s*-?[\d.,]+\s*$/.test(String(v));
export const fmtPct = (v) => (isNumericOnly(v) ? `${String(v).trim()}%` : String(v));

/** persentase pencapaian numerik; nilai ekstrem dipendekkan agar tidak jebol kotak */
export const fmtAch = (v) => (v > 999 ? ">999%" : `${Number(v || 0).toFixed(0)}%`);

/** perubahan % dari prev ke cur (null kalau tidak ada pembanding) */
export const pctDelta = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

export function formatRupiah(val) {
  const num = toNum(val);
  if (num === 0) return "Rp 0";
  const abs = Math.abs(num);
  const f = (n, min, max) => n.toLocaleString("id-ID", { minimumFractionDigits: min, maximumFractionDigits: max });
  if (abs >= 1e12) return `Rp ${f(num / 1e12, 1, 2)} T`;
  if (abs >= 1e9) return `Rp ${f(num / 1e9, 1, 2)} M`;
  if (abs >= 1e6) return `Rp ${f(num / 1e6, 1, 1)} Jt`;
  if (abs >= 1e3) return `Rp ${f(num / 1e3, 0, 0)} Rb`;
  return `Rp ${num.toLocaleString("id-ID")}`;
}